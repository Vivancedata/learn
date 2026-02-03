/**
 * Native Bridge Utilities for Capacitor
 *
 * This module provides utilities for interacting with native device features
 * when running as a native iOS/Android app through Capacitor.
 *
 * All functions gracefully degrade on web - they become no-ops when not
 * running in a native context.
 */

import { Capacitor } from '@capacitor/core'
import type { PluginListenerHandle } from '@capacitor/core'

// ============================================================================
// Platform Detection
// ============================================================================

/**
 * Check if running as a native app (iOS or Android)
 */
export const isNative = (): boolean => {
  if (typeof window === 'undefined') return false
  return Capacitor.isNativePlatform()
}

/**
 * Get the current platform
 * @returns 'ios' | 'android' | 'web'
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  if (typeof window === 'undefined') return 'web'
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web'
}

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => getPlatform() === 'ios'

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => getPlatform() === 'android'

/**
 * Check if running on web
 */
export const isWeb = (): boolean => getPlatform() === 'web'

/**
 * Check if a specific Capacitor plugin is available
 */
export const isPluginAvailable = (name: string): boolean => {
  return Capacitor.isPluginAvailable(name)
}

// ============================================================================
// Haptic Feedback
// ============================================================================

export type HapticStyle = 'light' | 'medium' | 'heavy'
export type HapticNotificationType = 'success' | 'warning' | 'error'

/**
 * Trigger haptic impact feedback
 * @param style - 'light' | 'medium' | 'heavy'
 */
export async function hapticImpact(style: HapticStyle = 'medium'): Promise<void> {
  if (!isNative() || !isPluginAvailable('Haptics')) return

  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    const styleMap: Record<HapticStyle, typeof ImpactStyle[keyof typeof ImpactStyle]> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    }
    await Haptics.impact({ style: styleMap[style] })
  } catch (error) {
    console.warn('Haptic feedback failed:', error)
  }
}

/**
 * Trigger haptic notification feedback
 * @param type - 'success' | 'warning' | 'error'
 */
export async function hapticNotification(type: HapticNotificationType = 'success'): Promise<void> {
  if (!isNative() || !isPluginAvailable('Haptics')) return

  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    const typeMap: Record<HapticNotificationType, typeof NotificationType[keyof typeof NotificationType]> = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    }
    await Haptics.notification({ type: typeMap[type] })
  } catch (error) {
    console.warn('Haptic notification failed:', error)
  }
}

/**
 * Trigger haptic selection feedback (for UI interactions)
 */
export async function hapticSelection(): Promise<void> {
  if (!isNative() || !isPluginAvailable('Haptics')) return

  try {
    const { Haptics } = await import('@capacitor/haptics')
    await Haptics.selectionStart()
    await Haptics.selectionChanged()
    await Haptics.selectionEnd()
  } catch (error) {
    console.warn('Haptic selection failed:', error)
  }
}

/**
 * Trigger device vibration
 * @param duration - Duration in milliseconds (default: 300)
 */
export async function vibrate(duration: number = 300): Promise<void> {
  if (!isNative() || !isPluginAvailable('Haptics')) return

  try {
    const { Haptics } = await import('@capacitor/haptics')
    await Haptics.vibrate({ duration })
  } catch (error) {
    console.warn('Vibration failed:', error)
  }
}

// ============================================================================
// Status Bar
// ============================================================================

export type StatusBarStyle = 'dark' | 'light' | 'default'

/**
 * Set status bar style
 * @param style - 'dark' (dark text) | 'light' (light text) | 'default'
 */
export async function setStatusBarStyle(style: StatusBarStyle): Promise<void> {
  if (!isNative() || !isPluginAvailable('StatusBar')) return

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    const styleMap: Record<StatusBarStyle, typeof Style[keyof typeof Style]> = {
      dark: Style.Dark,
      light: Style.Light,
      default: Style.Default,
    }
    await StatusBar.setStyle({ style: styleMap[style] })
  } catch (error) {
    console.warn('Set status bar style failed:', error)
  }
}

/**
 * Set status bar background color (Android only)
 * @param color - Hex color string (e.g., '#0f172a')
 */
export async function setStatusBarColor(color: string): Promise<void> {
  if (!isNative() || !isPluginAvailable('StatusBar') || !isAndroid()) return

  try {
    const { StatusBar } = await import('@capacitor/status-bar')
    await StatusBar.setBackgroundColor({ color })
  } catch (error) {
    console.warn('Set status bar color failed:', error)
  }
}

/**
 * Hide status bar
 */
export async function hideStatusBar(): Promise<void> {
  if (!isNative() || !isPluginAvailable('StatusBar')) return

  try {
    const { StatusBar } = await import('@capacitor/status-bar')
    await StatusBar.hide()
  } catch (error) {
    console.warn('Hide status bar failed:', error)
  }
}

/**
 * Show status bar
 */
export async function showStatusBar(): Promise<void> {
  if (!isNative() || !isPluginAvailable('StatusBar')) return

  try {
    const { StatusBar } = await import('@capacitor/status-bar')
    await StatusBar.show()
  } catch (error) {
    console.warn('Show status bar failed:', error)
  }
}

// ============================================================================
// Splash Screen
// ============================================================================

/**
 * Hide the splash screen
 * @param fadeOutDuration - Fade duration in milliseconds (default: 300)
 */
export async function hideSplashScreen(fadeOutDuration: number = 300): Promise<void> {
  if (!isNative() || !isPluginAvailable('SplashScreen')) return

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide({ fadeOutDuration })
  } catch (error) {
    console.warn('Hide splash screen failed:', error)
  }
}

/**
 * Show the splash screen
 */
export async function showSplashScreen(): Promise<void> {
  if (!isNative() || !isPluginAvailable('SplashScreen')) return

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.show({
      autoHide: false,
      fadeInDuration: 300,
      fadeOutDuration: 300,
    })
  } catch (error) {
    console.warn('Show splash screen failed:', error)
  }
}

// ============================================================================
// Keyboard
// ============================================================================

export interface KeyboardInfo {
  keyboardHeight: number
}

/**
 * Hide the keyboard
 */
export async function hideKeyboard(): Promise<void> {
  if (!isNative() || !isPluginAvailable('Keyboard')) return

  try {
    const { Keyboard } = await import('@capacitor/keyboard')
    await Keyboard.hide()
  } catch (error) {
    console.warn('Hide keyboard failed:', error)
  }
}

/**
 * Add keyboard show listener
 * @returns Cleanup function to remove the listener
 */
export async function onKeyboardShow(
  callback: (info: KeyboardInfo) => void
): Promise<PluginListenerHandle | null> {
  if (!isNative() || !isPluginAvailable('Keyboard')) return null

  try {
    const { Keyboard } = await import('@capacitor/keyboard')
    return await Keyboard.addListener('keyboardWillShow', callback)
  } catch (error) {
    console.warn('Add keyboard show listener failed:', error)
    return null
  }
}

/**
 * Add keyboard hide listener
 * @returns Cleanup function to remove the listener
 */
export async function onKeyboardHide(
  callback: () => void
): Promise<PluginListenerHandle | null> {
  if (!isNative() || !isPluginAvailable('Keyboard')) return null

  try {
    const { Keyboard } = await import('@capacitor/keyboard')
    return await Keyboard.addListener('keyboardWillHide', callback)
  } catch (error) {
    console.warn('Add keyboard hide listener failed:', error)
    return null
  }
}

// ============================================================================
// App State
// ============================================================================

export interface AppState {
  isActive: boolean
}

export interface AppUrlOpen {
  url: string
}

/**
 * Add app state change listener
 * @returns Cleanup function to remove the listener
 */
export async function onAppStateChange(
  callback: (state: AppState) => void
): Promise<PluginListenerHandle | null> {
  if (!isNative() || !isPluginAvailable('App')) return null

  try {
    const { App } = await import('@capacitor/app')
    return await App.addListener('appStateChange', callback)
  } catch (error) {
    console.warn('Add app state listener failed:', error)
    return null
  }
}

/**
 * Add back button listener (Android only)
 * @returns Cleanup function to remove the listener
 */
export async function onBackButton(
  callback: () => void
): Promise<PluginListenerHandle | null> {
  if (!isNative() || !isPluginAvailable('App') || !isAndroid()) return null

  try {
    const { App } = await import('@capacitor/app')
    return await App.addListener('backButton', callback)
  } catch (error) {
    console.warn('Add back button listener failed:', error)
    return null
  }
}

/**
 * Exit the app (Android only)
 */
export async function exitApp(): Promise<void> {
  if (!isNative() || !isPluginAvailable('App') || !isAndroid()) return

  try {
    const { App } = await import('@capacitor/app')
    await App.exitApp()
  } catch (error) {
    console.warn('Exit app failed:', error)
  }
}

/**
 * Get app info
 */
export async function getAppInfo(): Promise<{
  name: string
  id: string
  build: string
  version: string
} | null> {
  if (!isNative() || !isPluginAvailable('App')) return null

  try {
    const { App } = await import('@capacitor/app')
    return await App.getInfo()
  } catch (error) {
    console.warn('Get app info failed:', error)
    return null
  }
}

// ============================================================================
// Browser (External Links)
// ============================================================================

/**
 * Open URL in external browser
 * @param url - URL to open
 */
export async function openBrowser(url: string): Promise<void> {
  if (!isPluginAvailable('Browser')) {
    // Fallback to window.open on web
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  try {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url })
  } catch (error) {
    console.warn('Open browser failed:', error)
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

/**
 * Close the in-app browser
 */
export async function closeBrowser(): Promise<void> {
  if (!isPluginAvailable('Browser')) return

  try {
    const { Browser } = await import('@capacitor/browser')
    await Browser.close()
  } catch (error) {
    console.warn('Close browser failed:', error)
  }
}

// ============================================================================
// Share
// ============================================================================

export interface ShareOptions {
  title?: string
  text?: string
  url?: string
  dialogTitle?: string
}

/**
 * Share content using native share sheet
 */
export async function share(options: ShareOptions): Promise<void> {
  // Use Web Share API if available (works on web and native)
  if (navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      })
      return
    } catch (error) {
      // User cancelled or share failed
      console.warn('Share failed:', error)
    }
  }

  // Fallback: copy to clipboard
  if (options.url) {
    try {
      await navigator.clipboard.writeText(options.url)
      console.log('URL copied to clipboard')
    } catch (error) {
      console.warn('Copy to clipboard failed:', error)
    }
  }
}

// ============================================================================
// Network Status
// ============================================================================

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

/**
 * Add network status change listener
 * @returns Cleanup function to remove the listener
 */
export function onNetworkChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// ============================================================================
// Safe Area Insets
// ============================================================================

export interface SafeAreaInsets {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Get safe area insets (for notches, home indicators, etc.)
 * Uses CSS environment variables
 */
export function getSafeAreaInsets(): SafeAreaInsets {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }

  const computedStyle = getComputedStyle(document.documentElement)

  return {
    top: parseInt(computedStyle.getPropertyValue('--sat') || '0', 10) || 0,
    right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10) || 0,
    bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0', 10) || 0,
    left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10) || 0,
  }
}

/**
 * Apply safe area CSS variables to document
 * Call this on app initialization
 */
export function applySafeAreaVariables(): void {
  if (typeof window === 'undefined') return

  const style = document.documentElement.style
  style.setProperty('--sat', 'env(safe-area-inset-top)')
  style.setProperty('--sar', 'env(safe-area-inset-right)')
  style.setProperty('--sab', 'env(safe-area-inset-bottom)')
  style.setProperty('--sal', 'env(safe-area-inset-left)')
}
