"use client"

import Script from 'next/script'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

type CookieConsentDetail = {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

export default function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Memoize query string to avoid triggering duplicate FB events on re-renders
  const searchParamsKey = useMemo(() => searchParams?.toString() ?? '', [searchParams])
  const [mounted, setMounted] = useState(false)
  const [marketingEnabled, setMarketingEnabled] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const storedConsent = localStorage.getItem('cookie-consent')
    if (!storedConsent) return

    try {
      const parsed = JSON.parse(storedConsent)
      setMarketingEnabled(Boolean(parsed?.marketing))
    } catch (error) {
      console.error('Failed to parse cookie consent from localStorage', error)
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return

    const handleConsentChange = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentDetail>).detail
      if (!detail || typeof detail.marketing !== 'boolean') return

      setMarketingEnabled(detail.marketing)

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('consent', detail.marketing ? 'grant' : 'revoke')
      }
    }

    window.addEventListener('cookie-consent-changed', handleConsentChange)
    return () => window.removeEventListener('cookie-consent-changed', handleConsentChange)
  }, [mounted])

  useEffect(() => {
    if (!mounted || !marketingEnabled || !pixelId) return
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return

    window.fbq('track', 'PageView')
  }, [mounted, marketingEnabled, pixelId, pathname, searchParamsKey])

  useEffect(() => {
    if (!mounted || marketingEnabled) return
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return

    window.fbq('consent', 'revoke')
  }, [mounted, marketingEnabled])

  if (!pixelId || !mounted || !marketingEnabled) {
    return null
  }

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('consent', 'grant');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          alt="facebook pixel"
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  )
}
