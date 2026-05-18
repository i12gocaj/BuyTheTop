import type React from "react"
import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import { Playfair_Display, Source_Sans_3 } from "next/font/google"
import "./globals.css"
import Footer from "@/components/footer"
import ErrorBoundary from "@/components/error-boundary"
import GoogleTagManager, { GoogleTagManagerNoScript } from "@/components/google-tag-manager"
import MetaPixel from "@/components/meta-pixel"
import { DomainRedirect } from "@/components/domain-redirect"
import CookieBanner from "@/components/cookie-banner"
import { Toaster } from "sonner"

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
})

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
})

export const metadata: Metadata = {
  title: {
    default: "BuyTheTop - Premium Ranking Platform",
    template: "%s | BuyTheTop"
  },
  description: "Join the elite ranking platform where monetary contributions determine your position at the top. Climb the leaderboard and compete with others in this premium realm.",
  keywords: ["ranking platform", "leaderboard", "premium", "elite", "contributions", "competition", "top players"],
  authors: [{ name: "BuyTheTop" }],
  creator: "BuyTheTop",
  publisher: "BuyTheTop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://buythetop.vip'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "BuyTheTop - Premium Ranking Platform",
    description: "Join the elite ranking platform where monetary contributions determine your position at the top.",
    url: '/',
    siteName: 'BuyTheTop',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image',
        width: 1200,
        height: 630,
        alt: 'BuyTheTop - Premium Ranking Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "BuyTheTop - Premium Ranking Platform",
    description: "Join the elite ranking platform where monetary contributions determine your position at the top.",
    images: ['/og-image'],
    creator: '@buythetop',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  },
  // MEJORA: Meta tags específicos para móvil y PWA
  other: {
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'BuyTheTop',
    'application-name': 'BuyTheTop',
    'msapplication-TileColor': '#c9a96e',
    'theme-color': '#c9a96e',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BuyTheTop',
    description: 'Premium ranking platform where monetary contributions determine your position at the top',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://buythetop.vip',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://buythetop.vip'}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || 'https://buythetop.vip'} />
      </head>
      <body suppressHydrationWarning className="bg-[#0a0a0a] text-[#e5e5e5]">
        <GoogleTagManagerNoScript />
        <DomainRedirect />
        <GoogleTagManager />
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Footer />
        <CookieBanner />
        <Toaster 
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '1px solid #333',
              color: '#e5e5e5',
            },
          }}
        />
      </body>
    </html>
  )
}
