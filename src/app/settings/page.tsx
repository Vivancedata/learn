"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Moon, Sun, Bell, Globe, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/hooks/useAuth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTheme } from "next-themes"

function SettingsContent() {
  const { user, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState({
    projectFeedback: true,
    courseUpdates: true,
    communityMessages: false
  })

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

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Choose what you want to be notified about
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Project Feedback</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone comments on your project submissions
                  </p>
                </div>
                <Button 
                  variant={notifications.projectFeedback ? "default" : "outline"}
                  onClick={() => setNotifications(prev => ({
                    ...prev,
                    projectFeedback: !prev.projectFeedback
                  }))}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {notifications.projectFeedback ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Course Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new lessons and course content
                  </p>
                </div>
                <Button 
                  variant={notifications.courseUpdates ? "default" : "outline"}
                  onClick={() => setNotifications(prev => ({
                    ...prev,
                    courseUpdates: !prev.courseUpdates
                  }))}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {notifications.courseUpdates ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Community Messages</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified about messages from other students
                  </p>
                </div>
                <Button 
                  variant={notifications.communityMessages ? "default" : "outline"}
                  onClick={() => setNotifications(prev => ({
                    ...prev,
                    communityMessages: !prev.communityMessages
                  }))}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {notifications.communityMessages ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}
