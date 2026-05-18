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

const CompactStats = memo(function CompactStats() {
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
      <div className="flex items-center space-x-4 px-3 py-2 rounded-lg bg-[#1a1a1a]/80 border border-[#333]">
        <div className="flex items-center space-x-1">
          <div className="h-4 w-4 bg-[#333] rounded animate-pulse"></div>
          <div className="h-4 w-8 bg-[#333] rounded animate-pulse"></div>
        </div>
        <div className="h-4 w-px bg-[#333]"></div>
        <div className="flex items-center space-x-1">
          <div className="h-4 w-4 bg-[#333] rounded animate-pulse"></div>
          <div className="h-4 w-12 bg-[#333] rounded animate-pulse"></div>
        </div>
        <div className="h-4 w-px bg-[#333]"></div>
        <div className="flex items-center space-x-1">
          <div className="h-4 w-4 bg-[#333] rounded animate-pulse"></div>
          <div className="h-4 w-6 bg-[#333] rounded animate-pulse"></div>
        </div>
        <div className="h-4 w-px bg-[#333]"></div>
        <div className="flex items-center space-x-1">
          <div className="h-4 w-4 bg-[#333] rounded animate-pulse"></div>
          <div className="h-4 w-10 bg-[#333] rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="flex items-center space-x-4 px-3 py-2 rounded-lg bg-[#1a1a1a]/80 border border-[#333] hover:bg-[#1a1a1a] transition-all duration-300 hover:border-[#c9a96e]/30">
      {/* Total Participants */}
      <div className="flex items-center space-x-1.5" title="Total Participants">
        <Users className="h-4 w-4 text-[#c9a96e]" />
        <span className="text-sm font-medium text-[#c9a96e]">
          {formatNumber(stats.totalParticipants)}
        </span>
      </div>

      <div className="h-4 w-px bg-[#333]"></div>

      {/* Total Contributions */}
      <div className="flex items-center space-x-1.5" title="Total Pool">
        <Coins className="h-4 w-4 text-[#c9a96e]" />
        <span className="text-sm font-medium text-[#c9a96e]">
          {formatCurrency(stats.totalContributions, true, 0)}
        </span>
      </div>

      <div className="h-4 w-px bg-[#333]"></div>

      {/* Recent Activity */}
      <div className="flex items-center space-x-1.5" title="24h Activity">
        <TrendingUp className="h-4 w-4 text-[#c9a96e]" />
        <span className="text-sm font-medium text-[#c9a96e]">
          {stats.recentActivity}
        </span>
      </div>

      <div className="h-4 w-px bg-[#333]"></div>

      {/* Top Amount */}
      <div className="flex items-center space-x-1.5" title="Top Amount">
        <Trophy className="h-4 w-4 text-[#c9a96e]" />
        <span className="text-sm font-medium text-[#c9a96e]">
          {formatCurrency(stats.topAmount, true, 0)}
        </span>
      </div>
    </div>
  )
})

export default CompactStats
