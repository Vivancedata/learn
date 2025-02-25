import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { AvatarProps } from "@/types/ui"

export function Avatar({ className, src, alt, children, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt || "Avatar"}
          fill
          className="object-cover"
        />
      ) : (
        children
      )}
    </div>
  )
}
