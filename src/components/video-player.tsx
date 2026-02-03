"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { VideoProvider } from "@/types/course"
import { YouTubePlayer } from "./youtube-player"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  url: string
  onProgress?: (watchedSeconds: number, totalSeconds: number) => void
  onComplete?: () => void
  autoplay?: boolean
  startTime?: number
  className?: string
}

/**
 * Detects the video provider from a URL
 */
export function detectVideoProvider(url: string): VideoProvider | null {
  if (!url) return null

  const urlLower = url.toLowerCase()

  if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) {
    return "YOUTUBE"
  }
  if (urlLower.includes("vimeo.com")) {
    return "VIMEO"
  }
  if (urlLower.includes("wistia.com") || urlLower.includes("wistia.net")) {
    return "WISTIA"
  }

  // Check for common video file extensions for self-hosted
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".m4v"]
  if (videoExtensions.some((ext) => urlLower.includes(ext))) {
    return "SELF_HOSTED"
  }

  // Default to self-hosted if URL looks like a direct video link
  return "SELF_HOSTED"
}

/**
 * Extracts YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null

  // Standard YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
  const standardMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (standardMatch) return standardMatch[1]

  // Short URL: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]

  return null
}

/**
 * Extracts Vimeo video ID from URL
 */
export function extractVimeoId(url: string): string | null {
  if (!url) return null

  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match ? match[1] : null
}

/**
 * Universal video player component that auto-detects provider from URL
 */
export function VideoPlayer({
  url,
  onProgress,
  onComplete,
  autoplay = false,
  startTime = 0,
  className,
}: VideoPlayerProps) {
  const provider = detectVideoProvider(url)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(startTime)
  const [duration, setDuration] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Handle progress updates for self-hosted video
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const current = Math.floor(videoRef.current.currentTime)
      const total = Math.floor(videoRef.current.duration)
      setCurrentTime(current)
      setDuration(total)

      if (onProgress && total > 0) {
        onProgress(current, total)
      }

      // Check for completion (90% watched)
      if (total > 0 && current / total >= 0.9) {
        onComplete?.()
      }
    }
  }, [onProgress, onComplete])

  // Handle loaded metadata for self-hosted video
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(Math.floor(videoRef.current.duration))
      if (startTime > 0) {
        videoRef.current.currentTime = startTime
      }
    }
  }, [startTime])

  // Clean up progress interval
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  // Handle YouTube progress
  const handleYouTubeProgress = useCallback(
    (watched: number, total: number) => {
      setCurrentTime(watched)
      setDuration(total)
      onProgress?.(watched, total)
    },
    [onProgress]
  )

  // Handle YouTube completion
  const handleYouTubeComplete = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  // Render based on provider
  switch (provider) {
    case "YOUTUBE": {
      const videoId = extractYouTubeId(url)
      if (!videoId) {
        return (
          <div className={cn("bg-muted rounded-lg p-8 text-center", className)}>
            <p className="text-muted-foreground">Invalid YouTube URL</p>
          </div>
        )
      }
      return (
        <YouTubePlayer
          videoId={videoId}
          onProgress={handleYouTubeProgress}
          onComplete={handleYouTubeComplete}
          autoplay={autoplay}
          startTime={startTime}
          className={className}
        />
      )
    }

    case "VIMEO": {
      const vimeoId = extractVimeoId(url)
      if (!vimeoId) {
        return (
          <div className={cn("bg-muted rounded-lg p-8 text-center", className)}>
            <p className="text-muted-foreground">Invalid Vimeo URL</p>
          </div>
        )
      }
      return (
        <div className={cn("relative aspect-video w-full", className)}>
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplay ? 1 : 0}#t=${startTime}s`}
            className="absolute inset-0 h-full w-full rounded-lg"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Vimeo video player"
          />
        </div>
      )
    }

    case "WISTIA": {
      const wistiaMatch = url.match(/wistia\.(?:com|net)\/(?:medias|embed)\/([a-zA-Z0-9]+)/)
      const wistiaId = wistiaMatch ? wistiaMatch[1] : null
      if (!wistiaId) {
        return (
          <div className={cn("bg-muted rounded-lg p-8 text-center", className)}>
            <p className="text-muted-foreground">Invalid Wistia URL</p>
          </div>
        )
      }
      return (
        <div className={cn("relative aspect-video w-full", className)}>
          <iframe
            src={`https://fast.wistia.net/embed/iframe/${wistiaId}?autoPlay=${autoplay}&time=${startTime}`}
            className="absolute inset-0 h-full w-full rounded-lg"
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Wistia video player"
          />
        </div>
      )
    }

    case "SELF_HOSTED":
    default:
      return (
        <div className={cn("relative aspect-video w-full", className)}>
          <video
            ref={videoRef}
            src={url}
            className="h-full w-full rounded-lg bg-black"
            controls
            autoPlay={autoplay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={onComplete}
            playsInline
          >
            <track kind="captions" />
            Your browser does not support the video tag.
          </video>
        </div>
      )
  }
}

export default VideoPlayer
