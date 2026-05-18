'use client'

import { memo, useState, useEffect } from "react"
import { Users, Coins, Trophy, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface StatsData {
  totalParticipants: number
  totalContributions: number
  recentActivity: number
  topAmount: number
}

const MobileStats = memo(function MobileStats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats', { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Actualizar stats cada 30 segundos
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

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

  if (loading) {
    return (
      <div className="lg:hidden border-b border-[#333]/50 bg-[#0a0a0a]/95 backdrop-blur-md">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 bg-[#333] rounded animate-pulse"></div>
              <div className="h-3 w-8 bg-[#333] rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 bg-[#333] rounded animate-pulse"></div>
              <div className="h-3 w-12 bg-[#333] rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 bg-[#333] rounded animate-pulse"></div>
              <div className="h-3 w-6 bg-[#333] rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 bg-[#333] rounded animate-pulse"></div>
              <div className="h-3 w-10 bg-[#333] rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="lg:hidden border-b border-[#333]/50 bg-[#0a0a0a]/95 backdrop-blur-md">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          {/* Total Participants */}
          <div className="flex items-center space-x-1" title="Total Participants">
            <Users className="h-3 w-3 text-[#c9a96e]" />
            <span className="font-medium text-[#c9a96e]">
              {formatNumber(stats.totalParticipants)}
            </span>
          </div>

          {/* Total Contributions */}
          <div className="flex items-center space-x-1" title="Total Pool">
            <Coins className="h-3 w-3 text-[#c9a96e]" />
            <span className="font-medium text-[#c9a96e]">
              {formatCurrency(stats.totalContributions, true, 0)}
            </span>
          </div>

          {/* Recent Activity */}
          <div className="flex items-center space-x-1" title="24h Activity">
            <TrendingUp className="h-3 w-3 text-[#c9a96e]" />
            <span className="font-medium text-[#c9a96e]">
              {stats.recentActivity}
            </span>
          </div>

          {/* Top Amount */}
          <div className="flex items-center space-x-1" title="Top Amount">
            <Trophy className="h-3 w-3 text-[#c9a96e]" />
            <span className="font-medium text-[#c9a96e]">
              {formatCurrency(stats.topAmount, true, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})

export default MobileStats
