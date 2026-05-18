"use client"

import { ReactNode } from "react"
import ClientOnly from "@/components/client-only"

interface StableWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export default function StableWrapper({ children, fallback = null }: StableWrapperProps) {
  return (
    <ClientOnly fallback={fallback}>
      {children}
    </ClientOnly>
  )
}
