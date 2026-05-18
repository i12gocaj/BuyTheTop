"use client"

import { useEffect } from 'react'

export function DomainRedirect() {
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      
      // Si estamos en el dominio .pages.dev, redirigir al dominio personalizado
      if (hostname === 'buythetop.pages.dev') {
        const newUrl = `https://buythetop.vip${window.location.pathname}${window.location.search}${window.location.hash}`
        window.location.replace(newUrl)
      }
    }
  }, [])

  return null // No renderiza nada
}
