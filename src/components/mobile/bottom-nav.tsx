'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  Home,
  BookOpen,
  BarChart2,
  User
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  requiresAuth?: boolean
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/dashboard', label: 'Progress', icon: BarChart2, requiresAuth: true },
  { href: '/profile', label: 'Profile', icon: User, requiresAuth: true },
]

interface BottomNavProps {
  notificationCount?: number
}

/**
 * Mobile bottom navigation bar
 * Visible on screens < 768px, fixed to the bottom
 * Includes haptic feedback support and active state indicators
 */
export function BottomNav({ notificationCount = 0 }: BottomNavProps) {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Hide nav on scroll down, show on scroll up
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    const scrollThreshold = 10

    if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
      setIsVisible(false)
    } else {
      setIsVisible(true)
    }

    setLastScrollY(currentScrollY)
  }, [lastScrollY])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Trigger haptic feedback if supported
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const filteredItems = navItems.filter(item => {
    if (item.requiresAuth && !isAuthenticated) {
      return false
    }
    return true
  })

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
      role="navigation"
      aria-label="Mobile navigation"
    >
      {/* Glass background with blur */}
      <div className="bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-lg">
        {/* Safe area padding for notched phones */}
        <div className="pb-safe">
          <div className="flex items-center justify-around h-16 px-2">
            {filteredItems.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              const showBadge = item.href === '/profile' && notificationCount > 0

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={triggerHaptic}
                  className={cn(
                    'flex flex-col items-center justify-center',
                    'w-16 h-14 rounded-xl',
                    'transition-all duration-200 ease-out',
                    'touch-manipulation select-none',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    active
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    'active:scale-95'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <div className="relative">
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-all duration-200',
                        active && 'scale-110'
                      )}
                    />
                    {/* Notification badge */}
                    {showBadge && (
                      <span
                        className={cn(
                          'absolute -top-1 -right-1',
                          'min-w-[16px] h-4 px-1',
                          'flex items-center justify-center',
                          'bg-destructive text-destructive-foreground',
                          'text-[10px] font-bold rounded-full',
                          'animate-in zoom-in duration-200'
                        )}
                        aria-label={`${notificationCount} notifications`}
                      >
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </span>
                    )}
                    {/* Active indicator dot */}
                    {active && (
                      <span
                        className={cn(
                          'absolute -bottom-1 left-1/2 -translate-x-1/2',
                          'w-1 h-1 rounded-full bg-primary',
                          'animate-in fade-in zoom-in duration-200'
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium mt-1',
                      'transition-all duration-200',
                      active && 'font-semibold'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

/**
 * Spacer component to prevent content from being hidden behind the bottom nav
 * Add this at the end of page content on mobile
 */
export function BottomNavSpacer() {
  return <div className="h-20 md:hidden" aria-hidden="true" />
}
