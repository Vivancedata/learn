/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as stripeWebhook } from '../stripe/webhook/route'
import prisma from '@/lib/db'
import { constructWebhookEvent } from '@/lib/stripe'

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
    },
  },
}))

const mockedPrisma = prisma as jest.Mocked<typeof prisma>
const mockedConstruct = constructWebhookEvent as jest.MockedFunction<typeof constructWebhookEvent>

function webhookRequest() {
  return new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body: '{}',
    headers: { 'stripe-signature': 't=1,v1=abc' },
  })
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedConstruct.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { userId: 'user-1' },
          customer: 'cus_1',
          subscription: 'sub_1',
        },
      },
    } as never)
    ;(mockedPrisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockedPrisma.webhookEvent.upsert as jest.Mock).mockResolvedValue({})
    ;(mockedPrisma.webhookEvent.update as jest.Mock).mockResolvedValue({})
  })

  it('marks the event processed when the handler succeeds', async () => {
    ;(mockedPrisma.subscription.upsert as jest.Mock).mockResolvedValue({})

    const response = await stripeWebhook(webhookRequest())

    expect(response.status).toBe(200)
    expect(mockedPrisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ processed: true }) })
    )
  })

  // Answering 2xx tells Stripe the event was handled and it never retries,
  // so a transient DB error would leave a paid user without Pro for good.
  it('records the error and answers 5xx so Stripe retries a failed handler', async () => {
    ;(mockedPrisma.subscription.upsert as jest.Mock).mockRejectedValue(new Error('db down'))

    const response = await stripeWebhook(webhookRequest())

    expect(response.status).toBe(500)
    expect(mockedPrisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { error: 'db down' } })
    )
  })
})
