"use server"

import crypto from 'crypto'

interface SvixHeaders {
  id: string
  timestamp: string
  signature: string
}

export function extractSvixHeaders(headers: Headers): SvixHeaders | null {
  const id = headers.get('svix-id')
  const timestamp = headers.get('svix-timestamp')
  const signature = headers.get('svix-signature')

  if (!id || !timestamp || !signature) {
    return null
  }

  return { id, timestamp, signature }
}

export function verifySvixSignature(params: {
  payload: string
  secret: string
  headers: SvixHeaders
  toleranceSeconds?: number
}): boolean {
  const { payload, secret, headers, toleranceSeconds = 300 } = params
  const timestamp = Number(headers.timestamp)
  if (!Number.isFinite(timestamp)) {
    return false
  }

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return false
  }

  const signingSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const secretBytes = Buffer.from(signingSecret, 'base64')
  const signedPayload = `${headers.id}.${headers.timestamp}.${payload}`
  const expected = crypto
    .createHmac('sha256', secretBytes)
    .update(signedPayload)
    .digest('base64')

  const signatures = headers.signature
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split(','))
    .filter((pair) => pair[0] === 'v1' && pair[1])
    .map((pair) => pair[1])

  return signatures.some((sig) => timingSafeEqual(sig, expected))
}

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}
