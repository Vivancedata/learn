/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as createCheckout } from '../stripe/create-checkout-session/route'
import prisma from '@/lib/db'
import { createCheckoutSession, getOrCreateCustomer } from '@/lib/stripe'

// jest.setup.js stubs NextResponse; use the real one to read statuses.
jest.unmock('next/server')

jest.mock('@/lib/stripe', () => ({
  STRIPE_PRICES: { MONTHLY: 'price_monthly', YEARLY: 'price_yearly' },
  createCheckoutSession: jest.fn(),
  getOrCreateCustomer: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    subscription: { upsert: jest.fn() },
  },
}))

const USER_ID = '550e8400-e29b-41d4-a716-446655440000'
const mockedUserFind = prisma.user.findUnique as jest.Mock
const mockedUpsert = prisma.subscription.upsert as jest.Mock
const mockedCreateSession = createCheckoutSession as jest.MockedFunction<typeof createCheckoutSession>
const mockedGetCustomer = getOrCreateCustomer as jest.MockedFunction<typeof getOrCreateCustomer>

function checkoutRequest(priceId = 'price_yearly') {
  return new NextRequest('http://localhost:3000/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': USER_ID },
    body: JSON.stringify({ priceId }),
  })
}

describe('POST /api/stripe/create-checkout-session', () => {
  const originalFlag = process.env.NEXT_PUBLIC_PRO_TIER_ENABLED

  afterEach(() => {
    jest.clearAllMocks()
    if (originalFlag === undefined) delete process.env.NEXT_PUBLIC_PRO_TIER_ENABLED
    else process.env.NEXT_PUBLIC_PRO_TIER_ENABLED = originalFlag
  })

  describe('while the Pro tier is off (the default)', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_PRO_TIER_ENABLED
    })

    it('refuses with 403 before touching the database or Stripe', async () => {
      const response = await createCheckout(checkoutRequest())

      expect(response.status).toBe(403)
      expect(mockedUserFind).not.toHaveBeenCalled()
      expect(mockedGetCustomer).not.toHaveBeenCalled()
      expect(mockedCreateSession).not.toHaveBeenCalled()
    })

    it('treats any value other than "true" as off', async () => {
      process.env.NEXT_PUBLIC_PRO_TIER_ENABLED = '1'

      const response = await createCheckout(checkoutRequest())

      expect(response.status).toBe(403)
      expect(mockedCreateSession).not.toHaveBeenCalled()
    })
  })

  describe('with NEXT_PUBLIC_PRO_TIER_ENABLED="true"', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_PRO_TIER_ENABLED = 'true'
    })

    it('rejects a price that is not one of the configured plans', async () => {
      const response = await createCheckout(checkoutRequest('price_other'))

      expect(response.status).toBe(400)
      expect(mockedCreateSession).not.toHaveBeenCalled()
    })

    it('returns 404 when the user does not exist', async () => {
      mockedUserFind.mockResolvedValue(null)

      const response = await createCheckout(checkoutRequest())

      expect(response.status).toBe(404)
    })

    it('refuses a second subscription for an active subscriber', async () => {
      mockedUserFind.mockResolvedValue({
        id: USER_ID,
        email: 'learner@example.com',
        name: 'Learner',
        subscription: { status: 'active', stripeCustomerId: 'cus_1' },
      })

      const response = await createCheckout(checkoutRequest())

      expect(response.status).toBe(409)
      expect(mockedCreateSession).not.toHaveBeenCalled()
    })

    it('creates a Stripe customer and returns the checkout URL', async () => {
      mockedUserFind.mockResolvedValue({
        id: USER_ID,
        email: 'learner@example.com',
        name: null,
        subscription: null,
      })
      mockedGetCustomer.mockResolvedValue({ id: 'cus_new' } as never)
      mockedUpsert.mockResolvedValue({})
      mockedCreateSession.mockResolvedValue({ url: 'https://checkout.stripe.test/s' } as never)

      const response = await createCheckout(checkoutRequest('price_monthly'))
      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body.data.url).toBe('https://checkout.stripe.test/s')
      expect(mockedGetCustomer).toHaveBeenCalledWith(USER_ID, 'learner@example.com', undefined)
      expect(mockedCreateSession).toHaveBeenCalledWith(
        'cus_new',
        'price_monthly',
        USER_ID,
        expect.stringContaining('/checkout/success?session_id='),
        expect.stringContaining('/checkout/cancel')
      )
    })

    it('reuses a stored Stripe customer', async () => {
      mockedUserFind.mockResolvedValue({
        id: USER_ID,
        email: 'learner@example.com',
        name: 'Learner',
        subscription: { status: 'canceled', stripeCustomerId: 'cus_existing' },
      })
      mockedCreateSession.mockResolvedValue({ url: 'https://checkout.stripe.test/s2' } as never)

      const response = await createCheckout(checkoutRequest())

      expect(response.status).toBe(201)
      expect(mockedGetCustomer).not.toHaveBeenCalled()
      expect(mockedCreateSession.mock.calls[0][0]).toBe('cus_existing')
    })
  })
})
