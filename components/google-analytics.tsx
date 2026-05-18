"use client"

import Script from 'next/script'
import { useEffect, useState } from 'react'

export default function GoogleAnalytics() {
  const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    // Check if user has given consent for analytics
    const consent = localStorage.getItem('cookie-consent')
    if (consent) {
      const parsed = JSON.parse(consent)
      setAnalyticsEnabled(parsed.analytics)
    }
  }, [])

  useEffect(() => {
    if (analyticsEnabled && GA_TRACKING_ID && typeof window !== 'undefined') {
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
      
      if (hasUTMParams && window.gtag) {
        window.gtag('event', 'campaign_view', {
          ...campaignData,
          custom_parameter: 'buythetop_campaign'
        })
      }
    }
  }, [analyticsEnabled, GA_TRACKING_ID])

  if (!GA_TRACKING_ID || !analyticsEnabled) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          // Initialize with denied consent
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
          });
          
          gtag('config', '${GA_TRACKING_ID}', {
            page_title: document.title,
            page_location: window.location.href,
            // Enhanced tracking for campaigns
            allow_google_signals: true,
            allow_ad_personalization_signals: true,
            send_page_view: true,
            // Campaign attribution
            campaign_source: new URLSearchParams(window.location.search).get('utm_source'),
            campaign_medium: new URLSearchParams(window.location.search).get('utm_medium'),
            campaign_name: new URLSearchParams(window.location.search).get('utm_campaign'),
          });
        `}
      </Script>
    </>
  )
}
