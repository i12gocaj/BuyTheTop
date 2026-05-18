import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Crown, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface RankingEntry {
  user_id: string
  total_contribution: number
  current_position: number
  position_acquired_at: string
  days_in_position: number
  user_profiles: {
    display_name: string
    description: string | null
    avatar_url: string | null
  }
}

interface RankingPreviewProps {
  rankings: RankingEntry[]
  currentUserId: string
}

export default function RankingPreview({ rankings, currentUserId }: RankingPreviewProps) {
  const getPositionColor = (position: number) => {
    if (position === 1) return "text-[#FFD700]" // Oro más elegante
    if (position === 2) return "text-[#E6E6FA]" // Plata lavanda más distintiva
    if (position === 3) return "text-[#CD7F32]" // Bronce clásico
    return "text-[#c9a96e]"
  }

  const getPositionIcon = (position: number) => {
    if (position <= 3) {
      return <Crown className={`h-5 w-5 ${getPositionColor(position)}`} />
    }
    return null
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardHeader>
        <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
          <TrendingUp className="mr-2 h-6 w-6" />
          Current Top Rankings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rankings.length > 0 ? (
            rankings.map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  entry.user_id === currentUserId ? "border-[#c9a96e]/50 bg-[#c9a96e]/5" : "border-[#333] bg-[#0a0a0a]"
                }`}
              >
                {/* Position */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0a0a0a] border border-[#333]">
                  {getPositionIcon(entry.current_position)}
                  <span className={`text-sm font-bold ${getPositionColor(entry.current_position)}`}>
                    {entry.current_position <= 3 ? "" : `#${entry.current_position}`}
                  </span>
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10 border border-[#333]">
                  <AvatarImage src={entry.user_profiles?.avatar_url || undefined} alt={entry.user_profiles?.display_name} />
                  <AvatarFallback className="bg-[#333] text-[#c9a96e] text-sm">
                    {entry.user_profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[#e5e5e5] truncate">
                      {entry.user_profiles?.display_name || 'Usuario'}
                      {entry.user_id === currentUserId && <span className="ml-2 text-xs text-[#c9a96e]">(Tú)</span>}
                    </h4>
                    <span className="text-sm text-[#8a8a8a]">{formatCurrency(entry.total_contribution)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Crown className="h-12 w-12 text-[#333] mx-auto mb-2" />
              <p className="text-[#8a8a8a]">¡No hay rankings aún! ¡Sé el primero!</p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
          <h3 className="text-sm font-semibold text-[#c9a96e] mb-2">How to Climb</h3>
          <p className="text-xs text-[#8a8a8a]">
            To surpass a participant, your total contribution must exceed theirs by at least 0,01 €. Strategic
            contributions can help you climb multiple positions at once.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
