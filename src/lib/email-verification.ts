// Deliberately NOT a "use server" module. That directive turned
// createEmailVerificationToken into a Server Action -- a public endpoint any
// client can call with an arbitrary userId -- and it returns the plaintext
// code, which /api/auth/verify-email exchanges for a session. Only route
// handlers import it, and they need a plain server function.
import crypto from 'crypto'
import prisma from '@/lib/db'

export async function createEmailVerificationToken(userId: string) {
  // CSPRNG: this code is exchanged for a session by /api/auth/verify-email.
  const verificationCode = crypto.randomInt(100000, 1000000).toString()
  const codeHash = crypto.createHash('sha256').update(verificationCode).digest('hex')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.emailVerificationToken.deleteMany({
    where: {
      userId,
      used: false,
    },
  })

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      codeHash,
      expiresAt,
    },
  })

  return { verificationCode, expiresAt }
}
