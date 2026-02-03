'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Menu,
  MoreVertical,
  Share2,
  Settings
} from 'lucide-react'

interface MobileHeaderProps {
  /** Page title - if not provided, will be inferred from pathname */
  title?: string
  /** Show back button (auto-detected if not provided) */
  showBackButton?: boolean
  /** Custom back navigation handler */
  onBack?: () => void
  /** Show menu button */
  showMenuButton?: boolean
  /** Menu button click handler */
  onMenuClick?: () => void
  /** Show more options button */
  showMoreOptions?: boolean
  /** More options items */
  moreOptions?: Array<{
    label: string
    icon?: React.ComponentType<{ className?: string }>
    onClick: () => void
  }>
  /** Progress value (0-100) - shows progress bar at top */
  progress?: number
  /** Whether to show a loading indicator */
  isLoading?: boolean
  /** Whether the header should be transparent initially */
  transparentOnTop?: boolean
  /** Additional className */
  className?: string
}

// Map of paths to readable titles
const pathTitles: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/courses': 'Courses',
  '/paths': 'Learning Paths',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/leaderboard': 'Leaderboard',
  '/assessments': 'Assessments',
  '/pricing': 'Pricing',
}

/**
 * Mobile header component with back navigation, title, and optional menu
 * Features:
 * - Auto-detects back button visibility based on navigation history
 * - Progress indicator during navigation
 * - Scrolled state for visual feedback
 * - Configurable transparency
 */
export function MobileHeader({
  title,
  showBackButton,
  onBack,
  showMenuButton = false,
  onMenuClick,
  showMoreOptions = false,
  moreOptions = [],
  progress,
  isLoading = false,
  transparentOnTop = false,
  className
}: MobileHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Determine if we should show back button
  const shouldShowBack = showBackButton ?? (
    pathname !== '/' &&
    pathname !== '/dashboard' &&
    pathname !== '/courses' &&
    pathname !== '/paths'
  )

  // Get title from path if not provided
  const displayTitle = title || pathTitles[pathname] || getPageTitle(pathname)

  // Track scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }, [onBack, router])

  // Handle share action
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayTitle,
          url: window.location.href
        })
      } catch {
        // User cancelled or share failed
      }
    }
  }

  const defaultMoreOptions = [
    {
      label: 'Share',
      icon: Share2,
      onClick: handleShare
    },
    {
      label: 'Settings',
      icon: Settings,
      onClick: () => router.push('/settings')
    }
  ]

  const allOptions = moreOptions.length > 0 ? moreOptions : defaultMoreOptions

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 md:hidden',
        'transition-all duration-300',
        transparentOnTop && !scrolled
          ? 'bg-transparent'
          : 'bg-background/80 backdrop-blur-xl border-b border-border/50',
        scrolled && 'shadow-sm',
        className
      )}
      role="banner"
    >
      {/* Progress bar */}
      {typeof progress === 'number' && (
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              'h-full bg-primary transition-all duration-300 ease-out',
              isLoading && 'animate-pulse'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && typeof progress !== 'number' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted overflow-hidden">
          <div className="h-full w-1/3 bg-primary animate-loading-bar" />
        </div>
      )}

      {/* Safe area padding for notched phones */}
      <div className="pt-safe">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left section - Back button or menu */}
          <div className="flex items-center min-w-[48px]">
            {shouldShowBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className={cn(
                  'h-10 w-10 rounded-full',
                  '-ml-2',
                  'touch-manipulation',
                  'focus-visible:ring-2 focus-visible:ring-primary'
                )}
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {showMenuButton && !shouldShowBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className={cn(
                  'h-10 w-10 rounded-full',
                  '-ml-2',
                  'touch-manipulation'
                )}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Center - Title */}
          <h1
            className={cn(
              'flex-1 text-center font-semibold truncate',
              'transition-all duration-200',
              scrolled ? 'text-base' : 'text-lg'
            )}
          >
            {displayTitle}
          </h1>

          {/* Right section - More options */}
          <div className="flex items-center min-w-[48px] justify-end">
            {showMoreOptions && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={cn(
                    'h-10 w-10 rounded-full',
                    '-mr-2',
                    'touch-manipulation'
                  )}
                  aria-label="More options"
                  aria-expanded={showDropdown}
                  aria-haspopup="menu"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>

                {/* Dropdown menu */}
                {showDropdown && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDropdown(false)}
                      aria-hidden="true"
                    />
                    {/* Menu */}
                    <div
                      className={cn(
                        'absolute right-0 top-full mt-2 z-50',
                        'min-w-[200px] py-2',
                        'bg-popover border border-border rounded-xl shadow-lg',
                        'animate-in fade-in slide-in-from-top-2 duration-200'
                      )}
                      role="menu"
                    >
                      {allOptions.map((option, index) => {
                        const Icon = option.icon
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              option.onClick()
                              setShowDropdown(false)
                            }}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-3',
                              'text-sm text-foreground',
                              'hover:bg-muted transition-colors',
                              'touch-manipulation'
                            )}
                            role="menuitem"
                          >
                            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

/**
 * Spacer component to prevent content from being hidden behind the header
 * Add this at the top of page content on mobile
 */
export function MobileHeaderSpacer() {
  return <div className="h-14 md:hidden" aria-hidden="true" />
}

/**
 * Extract page title from pathname
 */
function getPageTitle(pathname: string): string {
  // Handle dynamic routes
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return 'Home'

  // Course lesson: /courses/[courseId]/lessons/[lessonId]
  if (segments[0] === 'courses' && segments[2] === 'lessons') {
    return 'Lesson'
  }

  // Course detail: /courses/[courseId]
  if (segments[0] === 'courses' && segments.length === 2) {
    return 'Course'
  }

  // Path detail: /paths/[pathId]
  if (segments[0] === 'paths' && segments.length === 2) {
    return 'Learning Path'
  }

  // Default: capitalize first segment
  return segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
}
