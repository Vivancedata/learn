import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import prisma from '@/lib/db'
import type { Stripe } from 'stripe'

/**
 * Map Stripe subscription status to our database enum
 */
function mapSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid' {
  const statusMap: Record<string, 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid'> = {
    active: 'active',
    canceled: 'canceled',
    past_due: 'past_due',
    trialing: 'trialing',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    unpaid: 'unpaid',
  }
  return statusMap[stripeStatus] || 'incomplete'
}

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events
 * NOTE: This endpoint must be excluded from authentication middleware
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify and construct webhook event
    let event: Stripe.Event

    try {
      event = constructWebhookEvent(body, signature)
    } catch (err) {
      void err // Signature verification failed - logged via Stripe dashboard
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Check if event was already processed (idempotency)
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    })

    if (existingEvent?.processed) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Store event for tracking
    await prisma.webhookEvent.upsert({
      where: { stripeEventId: event.id },
      update: {},
      create: {
        stripeEventId: event.id,
        eventType: event.type,
        payload: JSON.stringify(event.data.object),
      },
    })

    // Handle specific event types
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
          break

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break

        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
          break

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
          break

        default:
          // Unhandled event types are logged in webhook event record
          break
      }

      // Mark event as processed
      await prisma.webhookEvent.update({
        where: { stripeEventId: event.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      })
    } catch (error) {
      // Error is recorded in webhook event - don't fail the webhook
      await prisma.webhookEvent.update({
        where: { stripeEventId: event.id },
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    void error // Webhook errors tracked via Stripe dashboard
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle checkout.session.completed event
 * Activates the subscription after successful checkout
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!userId) {
    // Missing userId in metadata - checkout was not initiated correctly
    return
  }

  // Update subscription record
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: 'active',
    },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: 'active',
    },
  })

}

/**
 * Handle customer.subscription.updated event
 * Updates subscription status and period dates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Find subscription by Stripe customer ID
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!existingSubscription) {
    // Subscription not found - may have been deleted or customer not synced
    return
  }

  // Update subscription details
  // Cast subscription to any to handle API version differences
  const sub = subscription as Stripe.Subscription & {
    current_period_start?: number
    current_period_end?: number
  }

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      status: mapSubscriptionStatus(subscription.status),
      currentPeriodStart: sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : null,
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    },
  })

}

/**
 * Handle customer.subscription.deleted event
 * Marks subscription as canceled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Find subscription by Stripe customer ID
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!existingSubscription) {
    // Subscription not found - may have already been deleted
    return
  }

  // Update subscription status to canceled
  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: 'canceled',
      cancelAtPeriodEnd: false,
    },
  })

}

/**
 * Handle invoice.payment_succeeded event
 * Ensures subscription is active after successful payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  // Handle different API versions where subscription might be an object or string
  const invoiceData = invoice as Stripe.Invoice & { subscription?: string | { id: string } | null }
  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id

  if (!subscriptionId) {
    return // Not a subscription invoice
  }

  // Find subscription by Stripe customer ID
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!existingSubscription) {
    return
  }

  // Ensure subscription is active
  if (existingSubscription.status !== 'active') {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: { status: 'active' },
    })
  }

}

/**
 * Handle invoice.payment_failed event
 * Updates subscription status to past_due
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  // Handle different API versions where subscription might be an object or string
  const invoiceData = invoice as Stripe.Invoice & { subscription?: string | { id: string } | null }
  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id

  if (!subscriptionId) {
    return // Not a subscription invoice
  }

  // Find subscription by Stripe customer ID
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!existingSubscription) {
    return
  }

  // Update status to past_due
  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: { status: 'past_due' },
  })

  // TODO: Send notification to user about failed payment
}
