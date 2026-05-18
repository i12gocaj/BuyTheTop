import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Crown, Calendar, Coins } from "lucide-react"
import { type RankingEntry } from "@/lib/database"
import { formatCurrency } from "@/lib/utils"

interface RankingCardProps {
  entry: RankingEntry
}

export default function RankingCard({ entry }: RankingCardProps) {
  const getPositionColor = (position: number) => {
    if (position === 1) return "text-[#FFD700]" // Oro más elegante
    if (position === 2) return "text-[#E6E6FA]" // Plata lavanda más distintiva
    if (position === 3) return "text-[#CD7F32]" // Bronce clásico
    return "text-[#c9a96e]"
  }

  const getPositionIcon = (position: number) => {
    if (position <= 3) {
      return <Crown className={`h-6 w-6 ${getPositionColor(position)} drop-shadow-lg`} />
    }
    return null
  }

  const getCardStyle = (position: number) => {
    if (position === 1) {
      return "bg-[#1a1308] border-3 border-[#FFD700] shadow-[0_0_25px_rgba(255,215,0,0.4),0_0_50px_rgba(255,215,0,0.2),inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-2px_0_rgba(0,0,0,0.3)] relative before:absolute before:inset-[2px] before:bg-[#FFD700]/8 before:rounded-lg before:shadow-[inset_0_0_15px_rgba(255,215,0,0.2)] shimmer-gold"
    }
    if (position === 2) {
      return "bg-[#1a1a22] border-3 border-[#E6E6FA] shadow-[0_0_20px_rgba(230,230,250,0.35),0_0_40px_rgba(230,230,250,0.15),inset_0_2px_0_rgba(255,255,255,0.25),inset_0_-2px_0_rgba(0,0,0,0.25)] relative before:absolute before:inset-[2px] before:bg-[#E6E6FA]/6 before:rounded-lg before:shadow-[inset_0_0_12px_rgba(230,230,250,0.15)] shimmer-silver"
    }
    if (position === 3) {
      return "bg-[#1a0f0a] border-3 border-[#CD7F32] shadow-[0_0_18px_rgba(205,127,50,0.3),0_0_35px_rgba(205,127,50,0.12),inset_0_2px_0_rgba(255,255,255,0.2),inset_0_-2px_0_rgba(0,0,0,0.2)] relative before:absolute before:inset-[2px] before:bg-[#CD7F32]/6 before:rounded-lg before:shadow-[inset_0_0_10px_rgba(205,127,50,0.15)] shimmer-bronze"
    }
    return "bg-[#1a1a1a] border-[#333]"
  }

  const getPositionSize = (position: number) => {
    if (position === 1) return "h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
    if (position === 2) return "h-14 w-14 sm:h-18 sm:w-18 lg:h-20 lg:w-20"
    if (position === 3) return "h-12 w-12 sm:h-16 sm:w-16 lg:h-18 lg:w-18"
    return "h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14"
  }

  const getBorderColor = (position: number) => {
    if (position === 1) return "border-[#FFD700]/80"
    if (position === 2) return "border-[#E6E6FA]/80"
    if (position === 3) return "border-[#CD7F32]/80"
    return "border-[#333]"
  }

  const getCardWidth = (position: number) => {
    if (position === 1) return "w-full max-w-5xl ranking-top-1" // Más ancho para el top 1
    if (position === 2) return "w-full max-w-4xl ranking-top-2" // Ancho medio para el top 2
    if (position === 3) return "w-full max-w-3xl ranking-top-3" // Ancho menor para el top 3
    return "w-full max-w-2xl ranking-regular" // Ancho estándar para el resto
  }

  const formatDays = (days: number | null | undefined) => {
    const safeDays = days || 0
    if (safeDays === 0) return "Today"
    if (safeDays === 1) return "1 day"
    return `${safeDays} days`
  }

  return (
    <div className={`${getCardWidth(entry.current_position)} mx-auto ranking-container`}>
      <Card className={`${getCardStyle(entry.current_position)} hover:border-[#c9a96e]/70 transition-all duration-300 hover:shadow-lg hover:shadow-[#c9a96e]/10 transform hover:-translate-y-1 ranking-card relative`}>
        {/* Etiquetas en esquina superior derecha - solo móvil */}
        {entry.current_position <= 3 && (
          <div className="absolute top-1 right-1 sm:hidden flex flex-col gap-0.5 z-10">
            <Badge variant="secondary" className="bg-[#c9a96e]/20 text-[#c9a96e] border-[#c9a96e]/50 font-medium shadow-md text-[10px] px-1 py-0 h-4 leading-tight">
              ✨
            </Badge>
            {entry.current_position === 1 && (
              <Badge variant="secondary" className="bg-[#FFD700]/30 text-[#FFD700] border-[#FFD700]/60 font-medium shadow-md text-[10px] px-1 py-0 h-4 leading-tight">
                👑
              </Badge>
            )}
          </div>
        )}
        
        {/* "In position for..." en esquina inferior derecha - solo móvil */}
        <div className="absolute bottom-1 right-1 sm:hidden z-10">
          <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <Calendar className="h-2.5 w-2.5 text-[#666]" />
            <span className="text-[10px] text-[#666] leading-tight">{formatDays(entry.days_in_position)}</span>
          </div>
        </div>
        <CardContent className={`${
          entry.current_position === 1 
            ? 'p-2 sm:p-3 lg:p-4' 
            : entry.current_position === 2 
            ? 'p-2 sm:p-2.5 lg:p-3'
            : entry.current_position === 3
            ? 'p-1.5 sm:p-2 lg:p-2.5'
            : 'p-1.5 sm:p-2 lg:p-2.5'
        } card-content`}>
        <div className={`flex items-center ${
          entry.current_position === 1 
            ? 'space-x-2 sm:space-x-3' 
            : entry.current_position === 2 
            ? 'space-x-2 sm:space-x-2.5'
            : entry.current_position === 3
            ? 'space-x-1.5 sm:space-x-2'
            : 'space-x-1.5 sm:space-x-2'
        }`}>
          {/* Position */}
          <div className={`flex items-center justify-center ${getPositionSize(entry.current_position)} rounded-full bg-[#0a0a0a] border-2 ${entry.current_position <= 3 ? getBorderColor(entry.current_position) : 'border-[#333]'} relative flex-shrink-0 ${entry.current_position <= 3 ? 'shadow-lg' : ''}`}>
            {entry.current_position <= 3 && (
              <div className="absolute inset-0 rounded-full animate-pulse ring-2 ring-white/15 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]"></div>
            )}
            {entry.current_position === 1 && (
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(255,215,0,0.4),0_0_15px_rgba(255,215,0,0.3)] before:absolute before:inset-[1px] before:rounded-full before:bg-[#FFD700]/10"></div>
            )}
            {entry.current_position === 2 && (
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(230,230,250,0.3),0_0_12px_rgba(230,230,250,0.25)] before:absolute before:inset-[1px] before:rounded-full before:bg-[#E6E6FA]/8"></div>
            )}
            {entry.current_position === 3 && (
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_12px_rgba(205,127,50,0.25),0_0_10px_rgba(205,127,50,0.2)] before:absolute before:inset-[1px] before:rounded-full before:bg-[#CD7F32]/6"></div>
            )}
            {getPositionIcon(entry.current_position)}
            <span className={`${
              entry.current_position === 1 
                ? 'text-lg sm:text-2xl lg:text-4xl' 
                : entry.current_position === 2 
                ? 'text-base sm:text-xl lg:text-3xl'
                : entry.current_position === 3
                ? 'text-base sm:text-lg lg:text-2xl'
                : 'text-sm sm:text-base lg:text-lg'
            } font-bold ${getPositionColor(entry.current_position)} ${entry.current_position <= 3 ? 'drop-shadow-lg' : ''} relative z-10`}>
              {entry.current_position <= 3 ? "" : `#${entry.current_position}`}
            </span>
          </div>

          {/* Avatar */}
          <Avatar className={`${getPositionSize(entry.current_position)} border-2 ${entry.current_position <= 3 ? getBorderColor(entry.current_position) : 'border-[#333]'} transition-all duration-300 flex-shrink-0 ${entry.current_position <= 3 ? 'shadow-lg' : ''}`}>
            <AvatarImage src={entry.avatar_url || undefined} alt={entry.display_name || 'Anonymous'} />
            <AvatarFallback className={`${entry.current_position <= 3 ? 'bg-[#2a2a2a] text-white border-2 border-white/40 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.2)]' : 'bg-[#333]'} text-[#c9a96e] text-sm sm:text-lg lg:text-xl font-semibold`}>
              {(entry.display_name || 'A').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Nombre y badges - badges ocultos en móvil (están en esquina superior) */}
            <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${
              entry.current_position === 1 
                ? 'mb-1.5' 
                : entry.current_position === 2 
                ? 'mb-1.5'
                : entry.current_position === 3
                ? 'mb-1'
                : 'mb-1'
            }`}>
              <h3 className={`${
                entry.current_position === 1 
                  ? 'text-lg sm:text-xl lg:text-2xl text-white text-shadow-elite' 
                  : entry.current_position === 2 
                  ? 'text-lg sm:text-xl lg:text-xl text-white text-shadow-elite'
                  : entry.current_position === 3
                  ? 'text-base sm:text-lg lg:text-xl text-white text-shadow-elite'
                  : 'text-base sm:text-lg lg:text-lg text-[#e5e5e5]'
              } font-semibold leading-tight transition-all duration-300 ranking-title break-words overflow-wrap-anywhere flex-shrink-0`}>
                {entry.display_name || 'Anonymous'}
              </h3>
              {/* Badges solo visibles en desktop (ocultos en móvil) */}
              {entry.current_position <= 3 && (
                <Badge variant="secondary" className="hidden sm:inline-flex bg-[#c9a96e]/20 text-[#c9a96e] border-[#c9a96e]/50 font-semibold shadow-lg text-xs sm:text-sm flex-shrink-0">
                  ✨ Elite
                </Badge>
              )}
              {entry.current_position === 1 && (
                <Badge variant="secondary" className="hidden sm:inline-flex bg-[#FFD700]/30 text-[#FFD700] border-[#FFD700]/60 font-semibold shadow-lg text-xs lg:text-sm flex-shrink-0">
                  👑 Champion
                </Badge>
              )}
            </div>

            {entry.description && (
              <div className={`${
                entry.current_position === 1 
                  ? 'bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-white/20 mb-1.5' 
                  : entry.current_position === 2 
                  ? 'bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-white/20 mb-1.5'
                  : entry.current_position === 3
                  ? 'bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/20 mb-1'
                  : 'bg-black/20 backdrop-blur-sm rounded-md px-1.5 py-1 border border-white/10 mb-1'
              }`}>
                <p className={`${
                  entry.current_position === 1 
                    ? 'text-white text-sm sm:text-base text-shadow-subtle' 
                    : entry.current_position === 2 
                    ? 'text-white text-sm sm:text-base text-shadow-subtle'
                    : entry.current_position === 3
                    ? 'text-white text-sm sm:text-base text-shadow-subtle'
                    : 'text-white/90 text-sm'
                } line-clamp-6 sm:line-clamp-4 md:line-clamp-3 leading-relaxed break-words`}>
                  {entry.description}
                </p>
              </div>
            )}

            {/* Información compacta - solo monedas en móvil, completa en desktop */}
            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${
              entry.current_position === 1 
                ? 'text-xs sm:text-sm' 
                : entry.current_position === 2 
                ? 'text-xs sm:text-sm'
                : entry.current_position === 3
                ? 'text-xs sm:text-sm'
                : 'text-xs sm:text-sm'
            } text-[#666]`}>
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <Coins className={`${entry.current_position <= 3 ? 'h-3 w-3 sm:h-4 sm:w-4' : 'h-3 w-3'} ${entry.current_position <= 3 ? getPositionColor(entry.current_position) : 'text-[#c9a96e]'}`} />
                <span className={`font-semibold ${entry.current_position <= 3 ? 'text-white text-shadow-subtle' : 'text-[#e5e5e5]'} text-xs sm:text-sm`}>
                  {formatCurrency(entry.total_contribution)}
                </span>
              </div>
              {/* "In position for..." solo visible en desktop (oculto en móvil) */}
              <div className="hidden sm:flex items-center space-x-1.5 flex-shrink-0">
                <Calendar className={`${entry.current_position <= 3 ? 'h-3 w-3 sm:h-4 sm:w-4' : 'h-3 w-3'}`} />
                <span className={`${entry.current_position <= 3 ? 'text-white/80 text-shadow-subtle' : ''} text-xs sm:text-sm`}>In position for {formatDays(entry.days_in_position)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
