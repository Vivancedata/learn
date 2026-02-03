import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor Configuration for VivanceData Learning Platform
 *
 * This configuration enables building native iOS and Android apps from the Next.js web application.
 *
 * Setup Instructions:
 * 1. Run: npm install (to install Capacitor packages)
 * 2. Run: npm run build:mobile (to create static export)
 * 3. Run: npx cap add ios (first time only)
 * 4. Run: npx cap add android (first time only)
 * 5. Run: npx cap sync (after each build)
 * 6. Run: npx cap open ios OR npx cap open android
 */

const config: CapacitorConfig = {
  appId: 'com.vivancedata.learn',
  appName: 'VivanceData',
  webDir: 'out',

  server: {
    // Use HTTPS scheme for Android to avoid mixed content issues
    androidScheme: 'https',

    // For local development, uncomment these lines:
    // url: 'http://localhost:3000',
    // cleartext: true,

    // Handle navigation within the app
    allowNavigation: [
      'vivancedata.com',
      '*.vivancedata.com',
    ],
  },

  plugins: {
    SplashScreen: {
      // Duration to show splash screen (ms)
      launchShowDuration: 2000,

      // Background color matches app theme (slate-900)
      backgroundColor: '#0f172a',

      // Disable default spinner
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#6366f1', // Indigo-500

      // Splash screen animation
      launchAutoHide: true,
      launchFadeOutDuration: 300,

      // iOS specific
      splashFullScreen: false,
      splashImmersive: false,
    },

    PushNotifications: {
      // Notification presentation options
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    Keyboard: {
      // Resize behavior when keyboard appears
      resize: 'body',
      resizeOnFullScreen: true,

      // iOS specific
      style: 'dark',
    },

    StatusBar: {
      // Status bar style
      style: 'dark',
      backgroundColor: '#0f172a',

      // Overlay webview (iOS)
      overlaysWebView: false,
    },

    // Browser plugin for opening external links
    Browser: {
      // iOS presentation style
      presentationStyle: 'fullscreen',
    },

    // App plugin configuration
    App: {
      // Deep link URL scheme
      launchUrl: 'vivancedata://',
    },

    // Local notifications for study reminders
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#6366f1',
    },
  },

  ios: {
    // Content inset behavior
    contentInset: 'automatic',

    // Preferred content mode
    preferredContentMode: 'mobile',

    // URL scheme for deep links
    scheme: 'VivanceData',

    // Web view configuration
    backgroundColor: '#0f172a',

    // Allow scroll bouncing
    allowsLinkPreview: true,

    // Handle safe areas
    handleApplicationNotifications: true,

    // Limiter scroll behavior
    scrollEnabled: true,
  },

  android: {
    // Disable mixed content (HTTP in HTTPS)
    allowMixedContent: false,

    // Capture input events for full keyboard support
    captureInput: true,

    // Disable web contents debugging in production
    webContentsDebuggingEnabled: false,

    // Background color
    backgroundColor: '#0f172a',

    // Build options
    buildOptions: {
      keystorePath: undefined, // Set in CI/CD
      keystoreAlias: undefined,
    },

    // Initial focus on web view
    initialFocus: true,

    // Override user agent
    overrideUserAgent: undefined,

    // Append to user agent
    appendUserAgent: 'VivanceData-App',

    // Use legacy bridge
    useLegacyBridge: false,
  },

  // Environment-based configuration
  // Use --configuration flag to switch: npx cap sync --configuration production
  bundledWebRuntime: false,

  // Logging
  loggingBehavior: 'none', // 'none' | 'debug' | 'production'

  // Include plugins
  includePlugins: [
    '@capacitor/app',
    '@capacitor/browser',
    '@capacitor/haptics',
    '@capacitor/keyboard',
    '@capacitor/push-notifications',
    '@capacitor/splash-screen',
    '@capacitor/status-bar',
  ],
}

export default config
