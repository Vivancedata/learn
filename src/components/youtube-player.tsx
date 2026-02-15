"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

// Declare global YouTube types
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace YT {
  class Player {
    constructor(elementId: string, options: PlayerOptions)
    destroy(): void
    getCurrentTime(): number
    getDuration(): number
    getPlayerState(): number
    pauseVideo(): void
    playVideo(): void
    seekTo(seconds: number, allowSeekAhead?: boolean): void
    setVolume(volume: number): void
    getVolume(): number
    isMuted(): boolean
    mute(): void
    unMute(): void
  }
  interface PlayerOptions {
    videoId: string
    playerVars?: Record<string, unknown>
    events?: Record<string, (event: PlayerEvent) => void>
  }
  interface PlayerEvent {
    data: number
    target: Player
  }
  enum PlayerState {
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
  }
}

declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
}

interface YouTubePlayerProps {
  videoId: string
  onProgress?: (watchedSeconds: number, totalSeconds: number) => void
  onComplete?: () => void
  autoplay?: boolean
  startTime?: number
  className?: string
}

// Track API loading state globally
let isApiLoading = false
let isApiLoaded = false
const apiLoadCallbacks: (() => void)[] = []

/**
 * Load the YouTube IFrame API script
 */
function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (isApiLoaded && window.YT && window.YT.Player) {
      resolve()
      return
    }

    apiLoadCallbacks.push(resolve)

    if (isApiLoading) {
      return
    }

    isApiLoading = true

    // Create script element
    const script = document.createElement("script")
    script.src = "https://www.youtube.com/iframe_api"
    script.async = true

    // Set up the callback
    window.onYouTubeIframeAPIReady = () => {
      isApiLoaded = true
      isApiLoading = false
      apiLoadCallbacks.forEach((cb) => cb())
      apiLoadCallbacks.length = 0
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    )
    if (!existingScript) {
      document.head.appendChild(script)
    }
  })
}

/**
 * YouTube player component that uses the official IFrame API
 * Features:
 * - Lazy loads YouTube IFrame API
 * - Tracks watch progress
 * - Reports completion when 90%+ watched
 * - Keyboard shortcuts (space=pause, arrows=seek)
 */
export function YouTubePlayer({
  videoId,
  onProgress,
  onComplete,
  autoplay = false,
  startTime = 0,
  className,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasReportedCompletion = useRef(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track progress
  const trackProgress = useCallback(() => {
    if (!playerRef.current || !onProgress) return

    try {
      const currentTime = playerRef.current.getCurrentTime()
      const duration = playerRef.current.getDuration()

      if (duration > 0) {
        onProgress(Math.floor(currentTime), Math.floor(duration))

        // Check for completion (90% watched)
        if (!hasReportedCompletion.current && currentTime / duration >= 0.9) {
          hasReportedCompletion.current = true
          onComplete?.()
        }
      }
    } catch {
      // Player might not be ready, ignore
    }
  }, [onProgress, onComplete])

  // Initialize player
  useEffect(() => {
    let isMounted = true

    const initPlayer = async () => {
      try {
        await loadYouTubeApi()

        if (!isMounted || !containerRef.current) return

        // Create unique ID for the container
        const playerId = `youtube-player-${videoId}-${Date.now()}`
        containerRef.current.id = playerId

        playerRef.current = new window.YT.Player(playerId, {
          videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            start: Math.floor(startTime),
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (isMounted) {
                setIsReady(true)
                // Start progress tracking
                progressIntervalRef.current = setInterval(trackProgress, 1000)
              }
            },
            onStateChange: (event: YT.PlayerEvent) => {
              // YT.PlayerState.ENDED = 0
              if (event.data === 0) {
                onComplete?.()
              }
            },
            onError: (_event: YT.PlayerEvent) => {
              setError("Failed to load video. Please try again.")
            },
          },
        })
      } catch (_err) {
        if (isMounted) {
          setError("Failed to initialize video player.")
        }
      }
    }

    initPlayer()

    return () => {
      isMounted = false
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch {
          // Ignore errors during cleanup
        }
      }
    }
  }, [videoId, autoplay, startTime, trackProgress, onComplete])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!playerRef.current || !isReady) return

      // Only handle if not in an input/textarea
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return
      }

      try {
        switch (event.key) {
          case " ":
            event.preventDefault()
            const state = playerRef.current.getPlayerState()
            if (state === 1) {
              // Playing
              playerRef.current.pauseVideo()
            } else {
              playerRef.current.playVideo()
            }
            break
          case "ArrowLeft":
            event.preventDefault()
            playerRef.current.seekTo(
              Math.max(0, playerRef.current.getCurrentTime() - 10),
              true
            )
            break
          case "ArrowRight":
            event.preventDefault()
            playerRef.current.seekTo(
              playerRef.current.getCurrentTime() + 10,
              true
            )
            break
          case "ArrowUp":
            event.preventDefault()
            playerRef.current.setVolume(
              Math.min(100, playerRef.current.getVolume() + 10)
            )
            break
          case "ArrowDown":
            event.preventDefault()
            playerRef.current.setVolume(
              Math.max(0, playerRef.current.getVolume() - 10)
            )
            break
          case "f":
          case "F":
            // Toggle fullscreen (handled by iframe)
            break
          case "m":
          case "M":
            event.preventDefault()
            if (playerRef.current.isMuted()) {
              playerRef.current.unMute()
            } else {
              playerRef.current.mute()
            }
            break
        }
      } catch {
        // Ignore errors if player not ready
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isReady])

  // Seek to specific time
  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && isReady) {
      playerRef.current.seekTo(seconds, true)
    }
  }, [isReady])

  if (error) {
    return (
      <div
        className={cn(
          "relative aspect-video w-full rounded-lg bg-muted flex items-center justify-center",
          className
        )}
      >
        <div className="text-center p-4">
          <p className="text-destructive mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline"
          >
            Reload page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative aspect-video w-full", className)}>
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <div className="animate-pulse text-muted-foreground">
            Loading video...
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={cn("w-full h-full rounded-lg overflow-hidden", {
          invisible: !isReady,
        })}
      />
    </div>
  )
}

export default YouTubePlayer
