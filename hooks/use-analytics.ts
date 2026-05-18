"use client"

import { useCallback } from 'react'

// Tipos de eventos para tu aplicación
export type AnalyticsEventName = 
  | 'sign_up'
  | 'login'
  | 'purchase'
  | 'add_payment_info'
  | 'begin_checkout'
  | 'view_item'
  | 'view_ranking'
  | 'click_cta'
  | 'page_view'
  | 'video_play'
  | 'video_complete'
  | 'campaign_click'
  | 'social_share'
  | 'contact_form_submit'

export interface AnalyticsEventParams {
  // Parámetros estándar de Google Analytics
  currency?: string
  value?: number
  transaction_id?: string
  item_id?: string
  item_name?: string
  item_category?: string
  quantity?: number
  items?: Array<{
    item_id: string
    item_name: string
    item_category?: string
    quantity?: number
    price: number
  }>
  
  // Parámetros personalizados para BuyTheTop
  user_tier?: 'free' | 'premium' | 'vip'
  ranking_position?: number
  payment_amount?: number
  campaign_source?: string
  page_section?: string
  button_location?: string
  
  // Parámetros adicionales
  [key: string]: string | number | boolean | undefined | Array<any>
}

export function useAnalytics() {
  const trackEvent = useCallback((
    eventName: AnalyticsEventName, 
    parameters?: AnalyticsEventParams
  ) => {
    if (typeof window !== 'undefined') {
      // Agregar timestamp y datos adicionales
      const eventData = {
        ...parameters,
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        page_title: document.title,
        user_agent: navigator.userAgent,
      }

      // Enviar a Google Tag Manager (si está disponible)
      if (window.dataLayer) {
        window.dataLayer.push({
          event: eventName,
          ...eventData
        })
      }

      // Enviar a Google Analytics directamente (si está disponible)
      if (window.gtag) {
        window.gtag('event', eventName, eventData)
      }
      
      // Log para desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('Analytics Event:', eventName, eventData)
      }
    }
  }, [])

  // Funciones específicas para eventos comunes
  const trackPurchase = useCallback((params: {
    transaction_id: string
    value: number
    currency?: string
    items?: Array<{
      item_id: string
      item_name: string
      item_category?: string
      quantity?: number
      price: number
    }>
  }) => {
    trackEvent('purchase', {
      ...params,
      currency: params.currency || 'USD',
    })
  }, [trackEvent])

  const trackSignUp = useCallback((method?: string) => {
    trackEvent('sign_up', {
      method: method || 'email'
    })
  }, [trackEvent])

  const trackLogin = useCallback((method?: string) => {
    trackEvent('login', {
      method: method || 'email'
    })
  }, [trackEvent])

  const trackCTAClick = useCallback((params: {
    button_text: string
    button_location: string
    destination_url?: string
  }) => {
    trackEvent('click_cta', params)
  }, [trackEvent])

  const trackPageView = useCallback((pageName?: string) => {
    trackEvent('page_view', {
      page_name: pageName || document.title,
      page_location: window.location.href
    })
  }, [trackEvent])

  const trackRankingView = useCallback((position?: number) => {
    trackEvent('view_ranking', {
      ranking_position: position,
      page_section: 'ranking_list'
    })
  }, [trackEvent])

  // Función para rastrear campañas específicas de Instagram/Meta
  const trackCampaignInteraction = useCallback((params: {
    campaign_source: string
    campaign_medium: string
    campaign_name: string
    interaction_type: 'click' | 'view' | 'conversion'
    value?: number
  }) => {
    trackEvent('campaign_click', {
      campaign_source: params.campaign_source,
      campaign_medium: params.campaign_medium,
      campaign_name: params.campaign_name,
      interaction_type: params.interaction_type,
      value: params.value
    })
  }, [trackEvent])

  return {
    trackEvent,
    trackPurchase,
    trackSignUp,
    trackLogin,
    trackCTAClick,
    trackPageView,
    trackRankingView,
    trackCampaignInteraction,
  }
}

// Hook para rastrear conversiones desde UTM parameters
export function useCampaignTracking() {
  const { trackCampaignInteraction } = useAnalytics()

  const trackConversion = useCallback((value?: number) => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const source = urlParams.get('utm_source')
      const medium = urlParams.get('utm_medium')
      const campaign = urlParams.get('utm_campaign')

      if (source && medium && campaign) {
        trackCampaignInteraction({
          campaign_source: source,
          campaign_medium: medium,
          campaign_name: campaign,
          interaction_type: 'conversion',
          value
        })
      }
    }
  }, [trackCampaignInteraction])

  return { trackConversion }
}