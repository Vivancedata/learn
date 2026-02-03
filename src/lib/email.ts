/**
 * Email service using Resend
 * Handles all transactional emails for the VivanceData Learning Platform
 */

import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'VivanceData <noreply@vivancedata.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ============================================================================
// Types
// ============================================================================

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface PasswordResetEmailData {
  to: string
  userName: string
  resetToken: string
  expiresInHours: number
}

export interface EmailVerificationData {
  to: string
  userName: string
  verificationCode: string
  verificationToken: string
}

// ============================================================================
// Email Sending Functions
// ============================================================================

/**
 * Send password reset email
 * @param data - Password reset email data
 * @returns Result of the email send operation
 */
export async function sendPasswordResetEmail(
  data: PasswordResetEmailData
): Promise<SendEmailResult> {
  const resetUrl = `${APP_URL}/reset-password?token=${data.resetToken}`

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.to,
      subject: 'Reset Your VivanceData Password',
      html: getPasswordResetEmailHtml({
        userName: data.userName,
        resetUrl,
        expiresInHours: data.expiresInHours,
      }),
      text: getPasswordResetEmailText({
        userName: data.userName,
        resetUrl,
        expiresInHours: data.expiresInHours,
      }),
    })

    if (result.error) {
      return {
        success: false,
        error: result.error.message,
      }
    }

    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send email verification email
 * @param data - Email verification data
 * @returns Result of the email send operation
 */
export async function sendVerificationEmail(
  data: EmailVerificationData
): Promise<SendEmailResult> {
  const verificationUrl = `${APP_URL}/verify-email?token=${data.verificationToken}`

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.to,
      subject: 'Verify Your VivanceData Email',
      html: getVerificationEmailHtml({
        userName: data.userName,
        verificationCode: data.verificationCode,
        verificationUrl,
      }),
      text: getVerificationEmailText({
        userName: data.userName,
        verificationCode: data.verificationCode,
        verificationUrl,
      }),
    })

    if (result.error) {
      return {
        success: false,
        error: result.error.message,
      }
    }

    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// Email Template HTML Generators
// ============================================================================

interface PasswordResetTemplateData {
  userName: string
  resetUrl: string
  expiresInHours: number
}

function getPasswordResetEmailHtml(data: PasswordResetTemplateData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <div style="font-size: 28px; font-weight: 700; color: #18181b;">
                <span style="color: #7c3aed;">Vivance</span>Data
              </div>
              <p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">Learn AI & Data Science</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #18181b;">
                Reset Your Password
              </h1>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Hi ${escapeHtml(data.userName)},
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                We received a request to reset the password for your VivanceData account. Click the button below to create a new password:
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.resetUrl}"
                       style="display: inline-block; padding: 16px 32px; background-color: #7c3aed; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; transition: background-color 0.2s;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <div style="margin: 20px 0; padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>Important:</strong> This link will expire in ${data.expiresInHours} hour${data.expiresInHours > 1 ? 's' : ''}. After that, you will need to request a new password reset.
                </p>
              </div>

              <!-- Alternative Link -->
              <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 14px; word-break: break-all; color: #7c3aed;">
                ${data.resetUrl}
              </p>

              <!-- Security Notice -->
              <div style="margin: 30px 0 0; padding: 16px; background-color: #f4f4f5; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #52525b;">
                  <strong>Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e4e4e7; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #71717a; text-align: center;">
                This email was sent by VivanceData. If you have questions, contact us at support@vivancedata.com
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                &copy; ${new Date().getFullYear()} VivanceData. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

function getPasswordResetEmailText(data: PasswordResetTemplateData): string {
  return `
VivanceData - Reset Your Password

Hi ${data.userName},

We received a request to reset the password for your VivanceData account.

Reset your password by visiting this link:
${data.resetUrl}

IMPORTANT: This link will expire in ${data.expiresInHours} hour${data.expiresInHours > 1 ? 's' : ''}. After that, you will need to request a new password reset.

Didn't request this? If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

---
VivanceData - Learn AI & Data Science
This email was sent by VivanceData. If you have questions, contact us at support@vivancedata.com
`
}

interface VerificationTemplateData {
  userName: string
  verificationCode: string
  verificationUrl: string
}

function getVerificationEmailHtml(data: VerificationTemplateData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <div style="font-size: 28px; font-weight: 700; color: #18181b;">
                <span style="color: #7c3aed;">Vivance</span>Data
              </div>
              <p style="margin: 8px 0 0; color: #71717a; font-size: 14px;">Learn AI & Data Science</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #18181b;">
                Verify Your Email Address
              </h1>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Hi ${escapeHtml(data.userName)},
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Welcome to VivanceData! Please verify your email address to complete your registration and access all features.
              </p>

              <!-- Verification Code -->
              <div style="margin: 30px 0; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #71717a;">Your verification code:</p>
                <div style="display: inline-block; padding: 20px 40px; background-color: #f4f4f5; border-radius: 8px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #18181b; font-family: monospace;">
                  ${data.verificationCode}
                </div>
              </div>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46; text-align: center;">
                Or click the button below to verify automatically:
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.verificationUrl}"
                       style="display: inline-block; padding: 16px 32px; background-color: #7c3aed; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry Notice -->
              <div style="margin: 20px 0; padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>Note:</strong> This verification code expires in 24 hours. If you don't verify within this time, you can request a new code.
                </p>
              </div>

              <!-- Alternative Link -->
              <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 14px; word-break: break-all; color: #7c3aed;">
                ${data.verificationUrl}
              </p>

              <!-- Security Notice -->
              <div style="margin: 30px 0 0; padding: 16px; background-color: #f4f4f5; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #52525b;">
                  <strong>Didn't create an account?</strong> If you didn't sign up for VivanceData, please ignore this email. No account will be created.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e4e4e7; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #71717a; text-align: center;">
                This email was sent by VivanceData. If you have questions, contact us at support@vivancedata.com
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                &copy; ${new Date().getFullYear()} VivanceData. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

function getVerificationEmailText(data: VerificationTemplateData): string {
  return `
VivanceData - Verify Your Email Address

Hi ${data.userName},

Welcome to VivanceData! Please verify your email address to complete your registration and access all features.

Your verification code: ${data.verificationCode}

Or verify by visiting this link:
${data.verificationUrl}

NOTE: This verification code expires in 24 hours. If you don't verify within this time, you can request a new code.

Didn't create an account? If you didn't sign up for VivanceData, please ignore this email. No account will be created.

---
VivanceData - Learn AI & Data Science
This email was sent by VivanceData. If you have questions, contact us at support@vivancedata.com
`
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a secure 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  }
  return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char)
}

/**
 * Check if email service is configured
 * @returns true if RESEND_API_KEY is set
 */
export function isEmailServiceConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}
