"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "./button"
import { Badge } from "./badge"
import {
  BookOpen,
  LayoutDashboard,
  Map,
  Settings,
  Menu as MenuIcon,
  X,
  Sparkles,
  Trophy,
  Target,
  Crown
} from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { UserButton } from "./user-button"
import { useSubscription } from "@/hooks/useSubscription"
import { useAuth } from "@/hooks/useAuth"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { isPro, loading: subscriptionLoading } = useSubscription()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'glass border-b shadow-elevation-1'
        : 'bg-background/50 backdrop-blur-sm border-b border-transparent'
    }`}>
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="relative">
            <Sparkles className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Eureka
          </span>
        </Link>

        <div className="ml-auto flex items-center space-x-4">
          {/* Desktop navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-1">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/courses" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Courses</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/paths" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                <span>Paths</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/assessments" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Assessments</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/leaderboard" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span>Leaderboard</span>
              </Link>
            </Button>
          </div>

          <div className="hidden sm:flex sm:items-center sm:space-x-2 sm:pl-4 sm:border-l sm:border-border">
            {/* Subscription Status */}
            {isAuthenticated && !subscriptionLoading && (
              isPro ? (
                <Badge variant="default" className="bg-primary">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro
                </Badge>
              ) : (
                <Button size="sm" variant="default" asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                  <Link href="/pricing" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    <span>Upgrade</span>
                  </Link>
                </Button>
              )
            )}
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <UserButton />
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <div className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
        mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="glass border-t">
          <div className="container px-4 py-4 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link
              href="/courses"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-medium">Courses</span>
            </Link>
            <Link
              href="/paths"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Map className="h-5 w-5 text-primary" />
              <span className="font-medium">Learning Paths</span>
            </Link>
            <Link
              href="/assessments"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Target className="h-5 w-5 text-primary" />
              <span className="font-medium">Assessments</span>
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Trophy className="h-5 w-5 text-primary" />
              <span className="font-medium">Leaderboard</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="h-5 w-5 text-primary" />
              <span className="font-medium">Settings</span>
            </Link>
            {/* Upgrade Button for Mobile */}
            {isAuthenticated && !subscriptionLoading && !isPro && (
              <Link
                href="/pricing"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Crown className="h-5 w-5" />
                <span className="font-medium">Upgrade to Pro</span>
              </Link>
            )}
            {isAuthenticated && !subscriptionLoading && isPro && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Badge variant="default" className="bg-primary">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro Member
                </Badge>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 border-t mt-2 pt-4">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <div className="px-4 py-2">
              <UserButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
