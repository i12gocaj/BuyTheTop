export {}

declare global {
  type FacebookPixelFunction = {
    (...args: any[]): void
    queue?: any[]
    push?: FacebookPixelFunction
    loaded?: boolean
    version?: string
    callMethod?: (...args: any[]) => void
  }

  interface Window {
    fbq?: FacebookPixelFunction
    _fbq?: FacebookPixelFunction
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}
