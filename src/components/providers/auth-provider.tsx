"use client"

import { ReactNode } from "react"

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Auth provider wrapper component.
 * This project uses custom JWT authentication (see src/lib/auth.ts),
 * so this component simply passes through children.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>
}
