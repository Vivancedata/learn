import type { Metadata, Viewport } from "next"
import { Suspense } from "react"
import "./globals.css"
import { Navbar } from "@/components/ui/navbar"
import { ThemeProvider } from "@/components/ui/theme-provider"
import ErrorBoundary from "@/components/ErrorBoundary"
import { AuthProvider } from "@/contexts/AuthContext"
import { SubscriptionProvider } from "@/contexts/SubscriptionContext"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { PostHogProvider } from "@/components/providers/posthog-provider"
import { TutorProvider } from "@/components/ai-tutor/tutor-provider"
import { ChatContainer } from "@/components/ai-tutor/chat-container"
import { MobileProvider } from "@/components/mobile/mobile-provider"

export const metadata: Metadata = {
  title: "VivanceData Learning Platform",
  description: "Learn AI and Data Science with structured learning paths",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VivanceData",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-sans">
        <ErrorBoundary>
          <Suspense fallback={null}>
            <PostHogProvider>
              <AuthProvider>
                <SubscriptionProvider>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                  >
                    <TutorProvider>
                      <ServiceWorkerRegistration />
                      <MobileProvider
                        showBottomNav={true}
                        showOfflineIndicator={true}
                        showInstallPrompt={true}
                        installPromptMinVisits={2}
                      >
                        <Navbar />
                        <main className="container mx-auto py-8 px-4 pb-24 md:pb-8">
                          {children}
                        </main>
                        <ChatContainer />
                      </MobileProvider>
                    </TutorProvider>
                  </ThemeProvider>
                </SubscriptionProvider>
              </AuthProvider>
            </PostHogProvider>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  )
}
