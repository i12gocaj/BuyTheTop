"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import Pagination from "@/components/ui/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { formatCurrency } from "@/lib/utils"

interface PositionHistoryEntry {
  id: string
  old_position: number | null
  new_position: number
  contribution_amount: number
  created_at: string
}

interface PositionHistoryProps {
  positionHistory: PositionHistoryEntry[]
}

export default function PositionHistory({ positionHistory }: PositionHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatTimeInPosition = (startDate: string, endDate?: string) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const diffMs = Math.abs(end.getTime() - start.getTime())
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)
    
    return parts.join(' ')
  }

  // More precise deduplication - only remove true duplicates (same timestamp and contribution)
  const uniqueHistory = positionHistory.reduce((acc: PositionHistoryEntry[], entry, _index) => {
    // Check if we already have an exact duplicate entry
    const hasExactDuplicate = acc.some(existing => {
      // Exact match by ID (most reliable)
      if (existing.id === entry.id) {
        return true
      }
      
      // Exact match by all fields including timestamp (for entries without IDs)
      if (existing.old_position === entry.old_position && 
          existing.new_position === entry.new_position &&
          existing.contribution_amount === entry.contribution_amount &&
          existing.created_at === entry.created_at) {
        return true
      }
      
      // Very close timestamps (within 1 second) with same contribution and positions
      const timeDiff = Math.abs(new Date(existing.created_at).getTime() - new Date(entry.created_at).getTime())
      if (timeDiff < 1000 && 
          existing.old_position === entry.old_position && 
          existing.new_position === entry.new_position &&
          existing.contribution_amount === entry.contribution_amount) {
        return true
      }
      
      return false
    })
    
    if (!hasExactDuplicate) {
      acc.push(entry)
    }
    
    return acc
  }, [])

  // Paginación
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedHistory,
    goToPage
  } = usePagination({
    data: uniqueHistory,
    itemsPerPage: 5
  })



  const getPositionChange = (oldPos: number | null, newPos: number) => {
    if (!oldPos) {
      return {
        icon: <TrendingUp className="h-4 w-4 text-green-400" />,
        text: "Entered ranking",
        color: "text-green-400",
      }
    }

    if (newPos < oldPos) {
      return {
        icon: <TrendingUp className="h-4 w-4 text-green-400" />,
        text: `Moved up ${oldPos - newPos} position${oldPos - newPos > 1 ? "s" : ""}`,
        color: "text-green-400",
      }
    }

    if (newPos > oldPos) {
      return {
        icon: <TrendingDown className="h-4 w-4 text-red-400" />,
        text: `Moved down ${newPos - oldPos} position${newPos - oldPos > 1 ? "s" : ""}`,
        color: "text-red-400",
      }
    }

    return {
      icon: <Minus className="h-4 w-4 text-[#8a8a8a]" />,
      text: "Position unchanged",
      color: "text-[#8a8a8a]",
    }
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardHeader>
        <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
          <TrendingUp className="mr-2 h-6 w-6" />
          Position History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {uniqueHistory.length > 0 ? (
          <>
            <div className="space-y-4">
              {paginatedHistory.map((entry, index) => {
                const change = getPositionChange(entry.old_position, entry.new_position)
                
                // Para el cálculo de tiempo, como estamos ordenados por más reciente primero:
                // - Para posición actual (index 0): tiempo desde adquirida (desde entry.created_at hasta ahora)  
                // - Para posiciones históricas: tiempo desde cuando se adquirió hasta cuando se perdió (siguiente cambio)
                // Nota: necesitamos el índice en el array original para encontrar la entrada anterior correcta
                const originalIndex = uniqueHistory.findIndex(e => e.id === entry.id)
                const previousEntry = uniqueHistory[originalIndex - 1] // El cambio que reemplazó esta posición
                const timeInPosition = originalIndex === 0
                  ? formatTimeInPosition(entry.created_at) // Posición actual - tiempo desde adquirida
                  : formatTimeInPosition(entry.created_at, previousEntry?.created_at) // Histórica - tiempo hasta reemplazada
                
                return (
                  <div key={entry.id} className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {change.icon}
                        <span className={`font-semibold ${change.color}`}>{change.text}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#c9a96e]">#{entry.new_position}</div>
                        {entry.old_position && (
                          <div className="text-xs text-[#666]">
                            From #{entry.old_position}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-[#8a8a8a]">Contribution: {formatCurrency(entry.contribution_amount)}</p>
                      <p className="text-sm text-[#c9a96e]">Time in position: {timeInPosition}</p>
                      <p className="text-xs text-[#666]">{formatDate(entry.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-[#333] mx-auto mb-2" />
            <p className="text-[#8a8a8a]">No position changes yet</p>
            <p className="text-sm text-[#666]">Your ranking movements will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
