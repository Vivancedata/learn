"use server"

import crypto from 'crypto'
import prisma from '@/lib/db'

export async function createEmailVerificationToken(userId: string) {
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
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
