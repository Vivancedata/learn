"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Bell, Globe } from "lucide-react"

export default function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  const [notifications, setNotifications] = useState({
    projectFeedback: true,
    courseUpdates: true,
    communityMessages: false
  })

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and settings
        </p>
      </div>

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
              <div>
                <label className="block text-sm font-medium mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="Your display name"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  GitHub Username
                </label>
                <input
                  type="text"
                  placeholder="Your GitHub username"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <Button>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
