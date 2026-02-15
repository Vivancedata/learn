interface SendEmailInput {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

interface SendEmailResult {
  id?: string
  skipped?: boolean
}

export function isEmailServiceConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM_EMAIL
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !fromEmail) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service is not configured')
    }
    return { skipped: true }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
    }),
  })

  if (!response.ok) {
    const errorPayload = await response.text()
    throw new Error(`Email send failed: ${errorPayload}`)
  }

  const payload = (await response.json()) as { id?: string }
  return { id: payload.id }
}
