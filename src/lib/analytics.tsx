import { Analytics } from '@vercel/analytics/react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import posthog from 'posthog-js'

// Initialize PostHog
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug()
    }
  })
}

// Analytics wrapper component
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      
      // Track page view in PostHog
      posthog.capture('$pageview', {
        $current_url: url
      })
    }
  }, [pathname, searchParams])

  return (
    <>
      {children}
      <Analytics />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
    </>
  )
}

// Analytics utility functions
export const analytics = {
  track: async (eventName: string, properties?: Record<string, any>) => {
    try {
      // Track in PostHog
      posthog.capture(eventName, properties)

      // Track in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        ;(window as any).gtag('event', eventName, properties)
      }
    } catch (error) {
      console.error('Analytics error:', error)
    }
  },

  identify: async (userId: string, traits?: Record<string, any>) => {
    try {
      // Identify in PostHog
      posthog.identify(userId, traits)
    } catch (error) {
      console.error('Analytics identify error:', error)
    }
  },

  reset: async () => {
    try {
      // Reset in PostHog
      posthog.reset()
    } catch (error) {
      console.error('Analytics reset error:', error)
    }
  }
}