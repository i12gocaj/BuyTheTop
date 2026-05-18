import { Suspense } from "react"
import { Crown } from "lucide-react"
import RankingListServer from "@/components/ranking-list-server"
import RankingSearchWrapper from "@/components/ranking-search-wrapper"
import RankingHeader from "@/components/ranking-header"
import MobileStats from "@/components/mobile-stats"
import { Metadata } from "next"

export const runtime = 'edge'

// Metadata estática optimizada para SEO
export const metadata: Metadata = {
  title: "BuyTheTop - Premium Ranking Platform",
  description: "Join the elite ranking platform where monetary contributions determine your position at the top. Compete with others, climb the leaderboard, and showcase your status in our premium realm.",
  keywords: ["ranking platform", "leaderboard", "premium platform", "elite ranking", "top contributors", "competition", "status symbol", "exclusive ranking"],
  openGraph: {
    title: "BuyTheTop - Premium Ranking Platform",
    description: "Join the elite ranking platform where monetary contributions determine your position at the top. Compete with others and climb the leaderboard.",
    type: "website",
    images: [
      {
        url: "/og-image",
        width: 1200,
        height: 630,
        alt: "BuyTheTop - Premium Ranking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuyTheTop - Premium Ranking Platform",
    description: "Join the elite ranking platform where monetary contributions determine your position at the top.",
    images: ["/og-image"],
  },
  alternates: {
    canonical: "/",
  },
}

// SSR sin caché para datos en tiempo real del ranking
export const revalidate = 0

interface HomePageProps {
  searchParams?: Promise<{
    page?: string
    search?: string
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const page = Number.parseInt(params?.page ?? "1")
  const search = params?.search ?? ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] relative">
      {/* Gradiente sutil de fondo */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#c9a96e]/5 via-transparent to-[#c9a96e]/5 opacity-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#c9a96e]/10 via-transparent to-transparent"></div>
      
      <div className="relative z-10">
        <RankingHeader />
        <MobileStats />
        
        <div className="container mx-auto px-4 py-4 lg:py-6">
          <div className="text-center mb-6 lg:mb-8">
            <div className="relative">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#c9a96e] via-[#f4e27a] to-[#c9a96e] mb-3 lg:mb-4 font-serif animate-fadeInUp">
                BuyTheTop
              </h1>
              <div className="absolute inset-0 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#c9a96e]/20 blur-sm font-serif -z-10">
                BuyTheTop
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2 text-[#666] animate-fadeInUp text-base md:text-lg lg:text-xl mb-4" style={{animationDelay: '0.2s'}}>
              <Crown className="h-5 w-5 lg:h-6 lg:w-6 text-[#c9a96e]" />
              <span className="font-medium">Join the elite • Climb the rankings • Claim your throne</span>
              <Crown className="h-5 w-5 lg:h-6 lg:w-6 text-[#c9a96e]" />
            </div>
          </div>

          {/* Búsqueda - componente cliente con wrapper optimizado */}
          <RankingSearchWrapper initialSearch={search} />

          {/* Lista de rankings con SSR + ISR */}
          <Suspense
            key={`${page}-${search}`} // Key para forzar re-render cuando cambian params
            fallback={
              <div className="flex justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a96e]"></div>
                  <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-[#c9a96e]/20"></div>
                </div>
              </div>
            }
          >
            <RankingListServer page={page} search={search} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
