import { Card, CardContent } from "@/components/ui/card"
import { Users, Coins, Trophy, TrendingUp } from "lucide-react"
import { createClient } from '@supabase/supabase-js'
import { getBaseUrl } from '@/lib/url-utils'
import { formatCurrency } from "@/lib/utils"

// Server component para stats globales con ISR
// Last modified: 2025-08-23 03:15 TEST
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface GlobalStatsData {
  totalParticipants: number
  totalContributions: number
  recentActivity: number
  topAmount: number
}

async function fetchGlobalStats(): Promise<GlobalStatsData> {
  try {
    // Obtener total de participantes
    const { count: totalParticipants } = await supabase
      .from("rankings")
      .select("*", { count: "exact", head: true })

    // Obtener total de contribuciones
    const { data: totalContributionsData } = await supabase
      .from("rankings")
      .select("total_contribution")

    const totalContributions = totalContributionsData?.reduce(
      (sum: number, entry: any) => sum + (Number(entry.total_contribution) || 0), 0
    ) || 0

    // Obtener actividad reciente con fallback
    let recentActivity = 0
    try {
      const response = await fetch(
        `${getBaseUrl()}/api/stats/24h-activity`,
        { 
          cache: 'no-store', // Sin caché para datos en tiempo real
          headers: { 'Content-Type': 'application/json' }
        }
      )
      if (response.ok) {
        const activityData = await response.json()
        recentActivity = Number(activityData.recentActivity) || 0
      }
    } catch (fetchError) {
      console.warn("Failed to fetch 24h activity, using fallback:", fetchError)
      recentActivity = 0
    }

    // Obtener top contributor
    const { data: topContributor } = await supabase
      .from("rankings")
      .select("total_contribution")
      .order("total_contribution", { ascending: false })
      .limit(1)
      .single()

    return {
      totalParticipants: Number(totalParticipants) || 0,
      totalContributions: Number(totalContributions) || 0,
      recentActivity: Number(recentActivity) || 0,
      topAmount: Number(topContributor?.total_contribution) || 0,
    }
  } catch (error) {
    console.error("Error fetching global stats:", error)
    // Fallback data
    return {
      totalParticipants: 0,
      totalContributions: 0,
      recentActivity: 0,
      topAmount: 0,
    }
  }
}

export default async function GlobalStatsServer() {
  const stats = await fetchGlobalStats()

  const formatNumber = (num: number | null | undefined) => {
    const safeNum = num || 0
    if (safeNum >= 1e9) {
      return `${(safeNum / 1e9).toFixed(1)}B`
    } else if (safeNum >= 1e6) {
      return `${(safeNum / 1e6).toFixed(1)}M`
    } else if (safeNum >= 1e3) {
      return `${(safeNum / 1e3).toFixed(1)}K`
    }
    return safeNum.toString()
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 lg:gap-2 mb-3 lg:mb-4">
      {/* Total Participants */}
      <Card className="bg-[#1a1a1a]/80 border-[#333] backdrop-blur-sm hover:bg-[#1a1a1a] transition-all duration-300 hover:scale-105 hover:border-[#c9a96e]/30">
        <CardContent className="p-1.5 lg:p-2">
          <div className="flex items-center space-x-2 lg:space-x-3">
            <Users className="h-4 w-4 lg:h-5 lg:w-5 text-[#c9a96e]" />
            <div>
              <p className="text-xs lg:text-sm font-medium text-[#8a8a8a]">Participants</p>
              <p className="text-xl lg:text-2xl font-bold text-[#c9a96e]">
                {formatNumber(stats.totalParticipants)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Contributions */}
      <Card className="bg-[#1a1a1a]/80 border-[#333] backdrop-blur-sm hover:bg-[#1a1a1a] transition-all duration-300 hover:scale-105 hover:border-[#c9a96e]/30">
        <CardContent className="p-1.5 lg:p-2">
          <div className="flex items-center space-x-2 lg:space-x-3">
            <Coins className="h-4 w-4 lg:h-5 lg:w-5 text-[#c9a96e]" />
            <div>
              <p className="text-xs lg:text-sm font-medium text-[#8a8a8a]">Total Pool</p>
              <p className="text-xl lg:text-2xl font-bold text-[#c9a96e]">
                {formatCurrency(stats.totalContributions, true, 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-[#1a1a1a]/80 border-[#333] backdrop-blur-sm hover:bg-[#1a1a1a] transition-all duration-300 hover:scale-105 hover:border-[#c9a96e]/30">
        <CardContent className="p-1.5 lg:p-2">
          <div className="flex items-center space-x-2 lg:space-x-3">
            <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-[#c9a96e]" />
            <div>
              <p className="text-xs lg:text-sm font-medium text-[#8a8a8a]">24h Activity</p>
              <p className="text-xl lg:text-2xl font-bold text-[#c9a96e]">
                {stats.recentActivity}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Amount */}
      <Card className="bg-[#1a1a1a]/80 border-[#333] backdrop-blur-sm hover:bg-[#1a1a1a] transition-all duration-300 hover:scale-105 hover:border-[#c9a96e]/30">
        <CardContent className="p-1.5 lg:p-2">
          <div className="flex items-center space-x-2 lg:space-x-3">
            <Trophy className="h-4 w-4 lg:h-5 lg:w-5 text-[#c9a96e]" />
            <div>
              <p className="text-xs lg:text-sm font-medium text-[#8a8a8a]">Top Amount</p>
              <p className="text-xl lg:text-2xl font-bold text-[#c9a96e]">
                {formatCurrency(stats.topAmount, true, 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
