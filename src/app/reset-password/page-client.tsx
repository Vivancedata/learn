'use client'

import { useEffect, useReducer } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  KeyRound,
} from 'lucide-react'

interface ResetPasswordState {
  token: string | null
  tokenReady: boolean
  password: string
  confirmPassword: string
  error: string | null
  success: boolean
  isSubmitting: boolean
}

type ResetPasswordAction =
  | { type: 'tokenLoaded'; token: string | null }
  | { type: 'setPassword'; value: string }
  | { type: 'setConfirmPassword'; value: string }
  | { type: 'setError'; value: string | null }
  | { type: 'submitStart' }
  | { type: 'submitSuccess' }
  | { type: 'submitEnd' }

const initialResetPasswordState: ResetPasswordState = {
  token: null,
  tokenReady: false,
  password: '',
  confirmPassword: '',
  error: null,
  success: false,
  isSubmitting: false,
}

function resetPasswordReducer(
  state: ResetPasswordState,
  action: ResetPasswordAction
): ResetPasswordState {
  switch (action.type) {
    case 'tokenLoaded':
      return {
        ...state,
        token: action.token,
        tokenReady: true,
      }
    case 'setPassword':
      return {
        ...state,
        password: action.value,
      }
    case 'setConfirmPassword':
      return {
        ...state,
        confirmPassword: action.value,
      }
    case 'setError':
      return {
        ...state,
        error: action.value,
      }
    case 'submitStart':
      return {
        ...state,
        error: null,
        isSubmitting: true,
      }
    case 'submitSuccess':
      return {
        ...state,
        success: true,
        isSubmitting: false,
      }
    case 'submitEnd':
      return {
        ...state,
        isSubmitting: false,
      }
    default:
      return state
  }
}

function ResetPasswordForm() {
  const [
    { token, tokenReady, password, confirmPassword, error, success, isSubmitting },
    dispatch,
  ] = useReducer(resetPasswordReducer, initialResetPasswordState)

  useEffect(() => {
    dispatch({
      type: 'tokenLoaded',
      token: new URLSearchParams(window.location.search).get('token'),
    })
  }, [])

  const passwordStrength = {
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  }

  const isPasswordValid = Object.values(passwordStrength).every(Boolean)
  const passwordsMatch = password === confirmPassword && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'setError', value: null })

    if (!token) {
      dispatch({ type: 'setError', value: 'Reset token is missing or invalid' })
      return
    }

    if (!password || !confirmPassword) {
      dispatch({ type: 'setError', value: 'Please fill in all fields' })
      return
    }

    if (!isPasswordValid) {
      dispatch({ type: 'setError', value: 'Password does not meet the requirements' })
      return
    }

    if (password !== confirmPassword) {
      dispatch({ type: 'setError', value: 'Passwords do not match' })
      return
    }

    dispatch({ type: 'submitStart' })

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to reset password')
      }

      dispatch({ type: 'submitSuccess' })
    } catch (err) {
      dispatch({
        type: 'setError',
        value: err instanceof Error ? err.message : 'Something went wrong',
      })
    } finally {
      dispatch({ type: 'submitEnd' })
    }
  }

  if (!tokenReady) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>Invalid Reset Link</CardTitle>
            <CardDescription>
              The password reset link is invalid or missing a token
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/forgot-password" className="w-full">
              <Button className="w-full">Request New Reset Link</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <KeyRound className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Password Reset Successfully</CardTitle>
            <CardDescription>
              Your password has been changed. You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                For security reasons, you have been signed out of all sessions. Please sign in
                again.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href="/sign-in" className="w-full">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" id="error-message" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => dispatch({ type: 'setPassword', value: e.target.value })}
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />

              {password && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {passwordStrength.hasMinLength ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span
                      className={
                        passwordStrength.hasMinLength
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }
                    >
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.hasUpperCase ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span
                      className={
                        passwordStrength.hasUpperCase
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }
                    >
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.hasLowerCase ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span
                      className={
                        passwordStrength.hasLowerCase
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }
                    >
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordStrength.hasNumber ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span
                      className={
                        passwordStrength.hasNumber
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }
                    >
                      One number
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => dispatch({ type: 'setConfirmPassword', value: e.target.value })}
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />
              {confirmPassword && (
                <div className="flex items-center gap-2 mt-1 text-xs">
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-green-600 dark:text-green-400">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                      <span className="text-red-600 dark:text-red-400">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !isPasswordValid || !passwordsMatch}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Resetting password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>

            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-primary flex items-center"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Sign In
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
