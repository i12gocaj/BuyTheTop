import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, TrendingUp, Calendar, Coins } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface UserStatsProps {
  user: any
  userRanking: any
  userProfile?: any
}

export default function UserStats({ user: _user, userRanking, userProfile }: UserStatsProps) {

  const formatTimeInPosition = (startDate: string) => {
    const start = new Date(startDate)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0 || days > 0) parts.push(`${hours}h`)
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)
    
    return parts.join(' ')
  }

  const getPositionColor = (position: number | null) => {
    if (!position) return "text-[#8a8a8a]"
    if (position === 1) return "text-yellow-400"
    if (position === 2) return "text-gray-300"
    if (position === 3) return "text-amber-600"
    return "text-[#c9a96e]"
  }

  const getPositionBadge = (position: number | null) => {
    if (!position) return null
    if (position <= 3) {
      return (
        <Badge variant="secondary" className="bg-[#c9a96e]/20 text-[#c9a96e] border-[#c9a96e]/30">
          Elite
        </Badge>
      )
    }
    return null
  }

  const timeInPosition = userRanking?.position_acquired_at
    ? formatTimeInPosition(userRanking.position_acquired_at)
    : "N/A"

  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardHeader>
        <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
          <TrendingUp className="mr-2 h-6 w-6" />
          Your Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Current Position */}
          <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
            <div className="flex items-center justify-between mb-2">
              <Crown className={`h-6 w-6 ${getPositionColor(userRanking?.current_position)}`} />
              {getPositionBadge(userRanking?.current_position)}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#8a8a8a]">Current Position</p>
              <p className={`text-2xl font-bold ${getPositionColor(userRanking?.current_position)}`}>
                {userRanking?.current_position ? `#${userRanking.current_position}` : "Not ranked"}
              </p>
            </div>
          </div>

          {/* Total Contribution */}
          <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
            <div className="flex items-center mb-2">
              <Coins className="h-6 w-6 text-[#c9a96e]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#8a8a8a]">Total Contributed</p>
              <p className="text-2xl font-bold text-[#e5e5e5]">
                {formatCurrency(userRanking?.total_contribution || 0)}
              </p>
            </div>
          </div>

          {/* Time in Position */}
          <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
            <div className="flex items-center mb-2">
              <Calendar className="h-6 w-6 text-[#c9a96e]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#8a8a8a]">
                {userRanking?.current_position ? "Time in Current Position" : "Time Since Joined"}
              </p>
              <p className="text-2xl font-bold text-[#e5e5e5]">{timeInPosition}</p>
            </div>
          </div>

          {/* Member Since */}
          <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
            <div className="flex items-center mb-2">
              <Calendar className="h-6 w-6 text-[#c9a96e]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#8a8a8a]">Member Since</p>
              <p className="text-lg font-semibold text-[#e5e5e5]">
                {userProfile?.created_at ? 
                  (() => {
                    try {
                      // Parse ISO 8601 timestamp from PostgreSQL
                      const date = new Date(userProfile.created_at)
                      
                      if (isNaN(date.getTime())) {
                        return "Invalid date"
                      }
                      
                      return date.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    } catch {
                      return "Invalid date"
                    }
                  })() : 
                  "Not available"
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
