"use client"

import Script from 'next/script'
import { useEffect, useState } from 'react'

type CookieConsentDetail = {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

export default function GoogleTagManager() {
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID
  const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS
  const [mounted, setMounted] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    // Check if user has given consent for analytics
    const consent = localStorage.getItem('cookie-consent')
    if (consent) {
      const parsed = JSON.parse(consent)
      setAnalyticsEnabled(parsed.analytics)
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return

    const handleConsentChange = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentDetail>).detail
      if (detail && typeof detail.analytics === 'boolean') {
        setAnalyticsEnabled(detail.analytics)
      }
    }

    window.addEventListener('cookie-consent-changed', handleConsentChange)
    return () => window.removeEventListener('cookie-consent-changed', handleConsentChange)
  }, [mounted])

  useEffect(() => {
    if (!mounted || !analyticsEnabled || !GTM_ID || typeof window === 'undefined') {
      return
    }

    window.dataLayer = window.dataLayer || []

    // Track UTM parameters and campaign data
    const urlParams = new URLSearchParams(window.location.search)
    const campaignData = {
      campaign_source: urlParams.get('utm_source'),
      campaign_medium: urlParams.get('utm_medium'),
      campaign_name: urlParams.get('utm_campaign'),
      campaign_term: urlParams.get('utm_term'),
      campaign_content: urlParams.get('utm_content'),
      campaign_id: urlParams.get('utm_id'),
      // Instagram/Meta específicos
      fb_campaign_id: urlParams.get('fbclid'),
      ig_campaign_id: urlParams.get('igshid'),
    }

    // Only send campaign data if at least one UTM parameter exists
    const hasUTMParams = Object.values(campaignData).some(value => value !== null)
    
    if (hasUTMParams && window.dataLayer) {
      window.dataLayer.push({
        event: 'campaign_view',
        ...campaignData,
        custom_parameter: 'buythetop_campaign'
      })
    }
  }, [analyticsEnabled, GTM_ID, mounted])

  if (!mounted || !GTM_ID || !analyticsEnabled) {
    return null
  }

  return (
    <>
      {/* Google Tag Manager Script */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
      
      {/* Google Analytics directo como fallback */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              
              gtag('consent', 'default', {
                analytics_storage: 'granted',
                ad_storage: 'denied',
              });
              
              gtag('config', '${GA_ID}', {
                page_title: document.title,
                page_location: window.location.href,
                allow_google_signals: true,
                allow_ad_personalization_signals: true,
                send_page_view: true,
              });
            `}
          </Script>
        </>
      )}
    </>
  )
}

// Componente NoScript para usuarios sin JavaScript
export function GoogleTagManagerNoScript() {
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID
  
  if (!GTM_ID) return null
  
  return (
    <noscript>
      <iframe 
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0" 
        width="0" 
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}
