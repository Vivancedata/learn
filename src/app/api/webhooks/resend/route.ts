import prisma from '@/lib/db'
import { handleApiError, ApiError, HTTP_STATUS } from '@/lib/api-errors'
import { extractSvixHeaders, verifySvixSignature } from '@/lib/webhooks/resend'

export async function POST(request: Request) {
  try {
    const payload = await request.text()
    const headers = extractSvixHeaders(request.headers)
    const secret = process.env.RESEND_WEBHOOK_SECRET

    if (!headers) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Missing webhook headers')
    }

    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Webhook secret not configured')
      }
    } else {
      const isValid = verifySvixSignature({ payload, secret, headers })
      if (!isValid) {
        throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid webhook signature')
      }
    }

    let eventType = 'unknown'
    try {
      const parsed = JSON.parse(payload) as { type?: string; event?: { type?: string } }
      eventType = parsed.type || parsed.event?.type || 'unknown'
    } catch {
      eventType = 'unknown'
    }

    await prisma.resendWebhookEvent.upsert({
      where: { svixId: headers.id },
      update: { receivedAt: new Date(), eventType, payload },
      create: {
        svixId: headers.id,
        eventType,
        payload,
        receivedAt: new Date(),
      },
    })

    return Response.json({ received: true })
  } catch (error) {
    return handleApiError(error)
  }
}
