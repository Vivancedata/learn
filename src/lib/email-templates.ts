export function verificationEmailTemplate(input: { code: string; verificationUrl: string }) {
  const { code, verificationUrl } = input
  const subject = 'Verify your email address'
  const text = [
    `Your verification code is ${code}.`,
    'This code expires in 15 minutes.',
    `You can also verify at ${verificationUrl}.`,
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2 style="margin: 0 0 12px;">Verify your email</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 22px; letter-spacing: 2px; font-weight: 700;">${code}</p>
      <p>This code expires in 15 minutes.</p>
      <p>If the button doesn't work, use this link:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    </div>
  `

  return { subject, text, html }
}

export function passwordResetTemplate(input: { resetUrl: string }) {
  const { resetUrl } = input
  const subject = 'Reset your password'
  const text = [
    'We received a request to reset your password.',
    `Reset your password using this link: ${resetUrl}`,
    'If you did not request this, you can safely ignore this email.',
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2 style="margin: 0 0 12px;">Reset your password</h2>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `

  return { subject, text, html }
}
