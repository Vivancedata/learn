/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as stripeWebhook } from '../stripe/webhook/route'
import prisma from '@/lib/db'
import { constructWebhookEvent } from '@/lib/stripe'

// stripe-webhook.test.ts covers the retry contract. This file walks each
// event type the route handles and the guards around signature and replay.

// jest.setup.js stubs NextResponse; use the real one to read statuses.
jest.unmock('next/server')

jest.mock('@/lib/stripe', () => ({
  constructWebhookEvent: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    webhookEvent: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any
const mockedConstruct = constructWebhookEvent as jest.MockedFunction<typeof constructWebhookEvent>

function webhookRequest(signature: string | null = 't=1,v1=abc') {
  const headers: Record<string, string> = {}
  if (signature) headers['stripe-signature'] = signature
  return new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body: '{}',
    headers,
  })
}

function withEvent(type: string, object: Record<string, unknown>) {
  mockedConstruct.mockReturnValue({ id: 'evt_1', type, data: { object } } as never)
}

const existing = { id: 'row-1', status: 'active' }

beforeEach(() => {
  jest.clearAllMocks()
  db.webhookEvent.findUnique.mockResolvedValue(null)
  db.webhookEvent.upsert.mockResolvedValue({})
  db.webhookEvent.update.mockResolvedValue({})
  db.subscription.upsert.mockResolvedValue({})
  db.subscription.findFirst.mockResolvedValue(existing)
  db.subscription.update.mockResolvedValue({})
})

describe('request guards', () => {
  it('rejects a request without a signature header', async () => {
    const response = await stripeWebhook(webhookRequest(null))

    expect(response.status).toBe(400)
    expect(mockedConstruct).not.toHaveBeenCalled()
  })

  it('rejects a request whose signature does not verify', async () => {
    mockedConstruct.mockImplementation(() => {
      throw new Error('bad signature')
    })

    const response = await stripeWebhook(webhookRequest())

    expect(response.status).toBe(400)
    expect(db.webhookEvent.upsert).not.toHaveBeenCalled()
  })

  it('acknowledges an already-processed event without handling it again', async () => {
    withEvent('checkout.session.completed', { metadata: { userId: 'u1' } })
    db.webhookEvent.findUnique.mockResolvedValue({ processed: true })

    const response = await stripeWebhook(webhookRequest())

    expect(await response.json()).toEqual({ received: true, duplicate: true })
    expect(db.subscription.upsert).not.toHaveBeenCalled()
  })

  it('answers 500 when the event cannot even be recorded', async () => {
    withEvent('checkout.session.completed', {})
    db.webhookEvent.upsert.mockRejectedValue(new Error('db down'))

    const response = await stripeWebhook(webhookRequest())

    expect(response.status).toBe(500)
  })

  it('records a non-Error failure as an unknown error', async () => {
    withEvent('customer.subscription.deleted', { customer: 'cus_1' })
    db.subscription.findFirst.mockRejectedValue('boom')

    const response = await stripeWebhook(webhookRequest())

    expect(response.status).toBe(500)
    expect(db.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { error: 'Unknown error' } })
    )
  })

  it('marks unhandled event types processed without touching subscriptions', async () => {
    withEvent('customer.created', {})

    const response = await stripeWebhook(webhookRequest())

    expect(response.status).toBe(200)
    expect(db.subscription.update).not.toHaveBeenCalled()
    expect(db.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ processed: true }) })
    )
  })
})

describe('checkout.session.completed', () => {
  it('ignores a session without a userId in metadata', async () => {
    withEvent('checkout.session.completed', { metadata: {}, customer: 'cus_1' })

    await stripeWebhook(webhookRequest())

    expect(db.subscription.upsert).not.toHaveBeenCalled()
  })

  it('ignores a session with no metadata at all', async () => {
    withEvent('checkout.session.completed', { customer: 'cus_1' })

    await stripeWebhook(webhookRequest())

    expect(db.subscription.upsert).not.toHaveBeenCalled()
  })
})

describe('customer.subscription.created / updated', () => {
  it.each(['customer.subscription.created', 'customer.subscription.updated'])(
    '%s copies status, price and dates onto the subscription',
    async (type) => {
      withEvent(type, {
        id: 'sub_1',
        customer: 'cus_1',
        status: 'trialing',
        items: { data: [{ price: { id: 'price_1' } }] },
        current_period_start: 1_700_000_000,
        current_period_end: 1_702_592_000,
        cancel_at_period_end: true,
        trial_start: 1_700_000_000,
        trial_end: 1_701_000_000,
      })

      await stripeWebhook(webhookRequest())

      expect(db.subscription.update).toHaveBeenCalledWith({
        where: { id: 'row-1' },
        data: {
          stripeSubscriptionId: 'sub_1',
          stripePriceId: 'price_1',
          status: 'trialing',
          currentPeriodStart: new Date(1_700_000_000_000),
          currentPeriodEnd: new Date(1_702_592_000_000),
          cancelAtPeriodEnd: true,
          trialStart: new Date(1_700_000_000_000),
          trialEnd: new Date(1_701_000_000_000),
        },
      })
    }
  )

  it('nulls missing dates, drops a missing price, and maps unknown statuses to incomplete', async () => {
    withEvent('customer.subscription.updated', {
      id: 'sub_1',
      customer: 'cus_1',
      status: 'paused',
      items: { data: [] },
      cancel_at_period_end: false,
      trial_start: null,
      trial_end: null,
    })

    await stripeWebhook(webhookRequest())

    expect(db.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stripePriceId: undefined,
          status: 'incomplete',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          trialStart: null,
          trialEnd: null,
        }),
      })
    )
  })

  it('skips a customer with no subscription row', async () => {
    withEvent('customer.subscription.updated', { id: 'sub_1', customer: 'cus_x', status: 'active' })
    db.subscription.findFirst.mockResolvedValue(null)

    const response = await stripeWebhook(webhookRequest())

    expect(response.status).toBe(200)
    expect(db.subscription.update).not.toHaveBeenCalled()
  })
})

describe('customer.subscription.deleted', () => {
  it('marks the subscription canceled', async () => {
    withEvent('customer.subscription.deleted', { customer: 'cus_1' })

    await stripeWebhook(webhookRequest())

    expect(db.subscription.update).toHaveBeenCalledWith({
      where: { id: 'row-1' },
      data: { status: 'canceled', cancelAtPeriodEnd: false },
    })
  })

  it('skips a customer with no subscription row', async () => {
    withEvent('customer.subscription.deleted', { customer: 'cus_x' })
    db.subscription.findFirst.mockResolvedValue(null)

    await stripeWebhook(webhookRequest())

    expect(db.subscription.update).not.toHaveBeenCalled()
  })
})

describe.each([
  ['invoice.payment_succeeded', 'active'],
  ['invoice.payment_failed', 'past_due'],
])('%s', (type, status) => {
  it('ignores invoices that are not for a subscription', async () => {
    withEvent(type, { customer: 'cus_1', subscription: null })

    await stripeWebhook(webhookRequest())

    expect(db.subscription.findFirst).not.toHaveBeenCalled()
  })

  it('accepts the subscription as an expanded object', async () => {
    db.subscription.findFirst.mockResolvedValue({ id: 'row-1', status: 'past_due' })
    withEvent(type, { customer: 'cus_1', subscription: { id: 'sub_1' } })

    await stripeWebhook(webhookRequest())

    expect(db.subscription.update).toHaveBeenCalledWith({
      where: { id: 'row-1' },
      data: { status },
    })
  })

  it('skips a customer with no subscription row', async () => {
    db.subscription.findFirst.mockResolvedValue(null)
    withEvent(type, { customer: 'cus_x', subscription: 'sub_1' })

    await stripeWebhook(webhookRequest())

    expect(db.subscription.update).not.toHaveBeenCalled()
  })
})

describe('invoice.payment_succeeded', () => {
  it('leaves an already-active subscription alone', async () => {
    withEvent('invoice.payment_succeeded', { customer: 'cus_1', subscription: 'sub_1' })

    await stripeWebhook(webhookRequest())

    expect(db.subscription.update).not.toHaveBeenCalled()
  })
})
