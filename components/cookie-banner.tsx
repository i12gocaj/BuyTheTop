"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Cookie, X, Settings, Check } from "lucide-react"
import Link from "next/link"

interface CookieConsent {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true, // Always true, can't be disabled
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    // Check if user has already given consent
    const savedConsent = localStorage.getItem('cookie-consent')
    if (!savedConsent) {
      setShowBanner(true)
    } else {
      const parsed = JSON.parse(savedConsent)
      setConsent(parsed)
      // Apply consent settings
      applyConsentSettings(parsed)
    }
  }, [mounted])

  const applyConsentSettings = (consentSettings: CookieConsent) => {
    // Apply Google Analytics consent
    if (typeof window === 'undefined') return

    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: consentSettings.analytics ? 'granted' : 'denied',
        ad_storage: consentSettings.marketing ? 'granted' : 'denied',
      })
    }

    if (window.fbq) {
      window.fbq('consent', consentSettings.marketing ? 'grant' : 'revoke')
      if (consentSettings.marketing) {
        window.fbq('track', 'PageView')
      }
    }
  }

  const handleAcceptAll = () => {
    const allConsent: CookieConsent = {
      essential: true,
      analytics: true,
      marketing: true
    }
    saveConsent(allConsent)
  }

  const handleRejectAll = () => {
    const minimalConsent: CookieConsent = {
      essential: true,
      analytics: false,
      marketing: false
    }
    saveConsent(minimalConsent)
  }

  const handleSaveSettings = () => {
    saveConsent(consent)
  }

  const saveConsent = (consentSettings: CookieConsent) => {
    localStorage.setItem('cookie-consent', JSON.stringify(consentSettings))
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setConsent(consentSettings)
    applyConsentSettings(consentSettings)
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: consentSettings }))
    setShowBanner(false)
    setShowSettings(false)
  }

  const toggleConsent = (type: keyof CookieConsent) => {
    if (type === 'essential') return // Can't toggle essential cookies
    setConsent(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  if (!mounted || !showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="bg-[#1a1a1a] border-[#333] shadow-2xl">
        <div className="p-6">
          {!showSettings ? (
            // Main banner
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Cookie className="h-6 w-6 text-[#c9a96e] flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    We Use Cookies
                  </h3>
                  <p className="text-sm text-[#8a8a8a] mb-3">
                    We use essential cookies to make our platform work, and analytics cookies to understand 
                    how you use our platform so we can improve it. Payment processing also requires cookies 
                    for security.{" "}
                    <Link href="/privacy" className="text-[#c9a96e] hover:underline">
                      Learn more in our Privacy Policy
                    </Link>.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                <Button
                  onClick={handleAcceptAll}
                  className="bg-[#c9a96e] hover:bg-[#b8956a] text-black font-medium"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept All
                </Button>
                <Button
                  onClick={handleRejectAll}
                  variant="outline"
                  className="border-[#333] bg-transparent text-[#8a8a8a] hover:bg-[#2a2a2a] hover:text-white"
                >
                  Reject All
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="ghost"
                  className="text-[#c9a96e] hover:bg-[#c9a96e]/10"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Customize
                </Button>
              </div>
            </div>
          ) : (
            // Settings panel
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Cookie Preferences
                </h3>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="ghost"
                  size="sm"
                  className="text-[#8a8a8a] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">Essential Cookies</h4>
                    <p className="text-sm text-[#8a8a8a]">
                      Required for authentication, security, and basic platform functionality.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-12 h-6 bg-[#c9a96e] rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">Analytics Cookies</h4>
                    <p className="text-sm text-[#8a8a8a]">
                      Help us understand platform usage to improve user experience.
                    </p>
                  </div>
                  <button
                    onClick={() => toggleConsent('analytics')}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      consent.analytics ? 'bg-[#c9a96e] justify-end' : 'bg-[#333] justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">Marketing Cookies</h4>
                    <p className="text-sm text-[#8a8a8a]">
                      Used for payment processing and fraud prevention via Stripe.
                    </p>
                  </div>
                  <button
                    onClick={() => toggleConsent('marketing')}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      consent.marketing ? 'bg-[#c9a96e] justify-end' : 'bg-[#333] justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveSettings}
                  className="bg-[#c9a96e] hover:bg-[#b8956a] text-black font-medium"
                >
                  Save Preferences
                </Button>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="outline"
                  className="border-[#333] bg-transparent text-[#8a8a8a] hover:bg-[#2a2a2a] hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
