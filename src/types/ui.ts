import { HTMLAttributes } from "react"

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
}

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

export type CardProps = HTMLAttributes<HTMLDivElement>

export interface InputProps extends HTMLAttributes<HTMLInputElement> {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
}

export interface TextareaProps extends HTMLAttributes<HTMLTextAreaElement> {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  required?: boolean
}

export interface ProgressCircleProps {
  progress: number
  size?: "sm" | "md" | "lg" | "xl"
  showPercentage?: boolean
  className?: string
}
