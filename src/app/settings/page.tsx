"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Moon, Sun, Globe, Loader2, AlertCircle, CheckCircle2, Crown, CreditCard, Calendar, ExternalLink } from "lucide-react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/hooks/useAuth"
import { useSubscription, useSubscriptionActions } from "@/hooks/useSubscription"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { NotificationPreferences } from "@/components/notification-preferences"
import Link from "next/link"

function SettingsContent() {
  const { user, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()

  // Profile form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [githubUsername, setGithubUsername] = useState("")

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setGithubUsername(user.githubUsername || "")
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error("Authentication required")
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name || undefined,
          githubUsername: githubUsername || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }

      // Refresh user data in auth context
      await refreshUser()

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-success bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how Eureka looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="flex-1"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="flex-1"
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="flex-1"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  System
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {theme === "system"
                  ? "Using your system's theme preference"
                  : `Currently using ${theme} mode`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <SubscriptionCard />

        <NotificationPreferences />

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">
                  Display Name
                </Label>
                <Input
                  id="display-name"
                  type="text"
                  placeholder="Your display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  disabled
                  title="Email cannot be changed"
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="github-username">
                  GitHub Username
                </Label>
                <Input
                  id="github-username"
                  type="text"
                  placeholder="Your GitHub username"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SubscriptionCard() {
  const { subscription, isPro, isTrialing, willCancel, daysUntilExpiry, loading } = useSubscription()
  const { openPortal } = useSubscriptionActions()
  const [portalLoading, setPortalLoading] = useState(false)

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      await openPortal()
    } catch (error) {
      console.error('Failed to open portal:', error)
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          {isPro && (
            <Badge variant="default" className="bg-primary">
              <Crown className="h-3 w-3 mr-1" />
              Pro
            </Badge>
          )}
        </div>
        <CardDescription>
          Manage your subscription and billing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPro ? (
          <div className="space-y-4">
            {/* Subscription Status */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Pro Subscription</p>
                <p className="text-sm text-muted-foreground">
                  {isTrialing ? 'Trial period' : 'Active'}
                  {willCancel && ' (Cancels at end of period)'}
                </p>
              </div>
              <Badge variant={willCancel ? 'secondary' : 'default'}>
                {subscription?.status}
              </Badge>
            </div>

            {/* Period Info */}
            {subscription?.currentPeriodEnd && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {willCancel ? 'Access until' : 'Renews on'}:{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            {/* Warning Messages */}
            {willCancel && daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription ends in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}.
                  Renew to keep access to Pro features.
                </AlertDescription>
              </Alert>
            )}

            {/* Manage Button */}
            <Button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="w-full"
            >
              {portalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  Manage Subscription
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Update payment method, change plan, or cancel
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">Free Plan</p>
              <p className="text-sm text-muted-foreground">
                Limited to {3} courses
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Upgrade to Pro for:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Unlimited course access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Skill assessments
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Verified certificates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Priority support
                </li>
              </ul>
            </div>

            <Button asChild className="w-full">
              <Link href="/pricing">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}
