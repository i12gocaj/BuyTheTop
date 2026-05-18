import RankingCard from "@/components/ranking-card"
import RankingPagination from "@/components/ranking-pagination"
import { Crown } from "lucide-react"
import { getRankingWithProfiles, type RankingEntry } from "@/lib/database"

// TEST: Last modified 2025-08-23 03:15

interface RankingListServerProps {
  page: number
  search: string
}

export default async function RankingListServer({ page, search }: RankingListServerProps) {
  const itemsPerPage = 10
  
  try {
    const { data: rankings, count, error } = await getRankingWithProfiles(page, search, itemsPerPage)
    
    if (error) {
      console.error("Error fetching rankings:", error)
      return (
        <div className="text-center py-12">
          <Crown className="h-16 w-16 text-[#c9a96e]/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#c9a96e] mb-2">Error Loading Rankings</h3>
          <p className="text-[#8a8a8a]">
            Unable to load rankings at this time. Please try again later.
          </p>
        </div>
      )
    }

    const totalPages = Math.ceil(count / itemsPerPage)

    if ((!rankings || rankings.length === 0) && search) {
      return (
        <div className="text-center py-12">
          <Crown className="h-16 w-16 text-[#c9a96e]/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#c9a96e] mb-2">No results found</h3>
          <p className="text-[#8a8a8a]">
            No participants found matching "{search}". Try a different search term.
          </p>
        </div>
      )
    }

    if (!rankings || rankings.length === 0) {
      return (
        <div className="text-center py-12">
          <Crown className="h-16 w-16 text-[#c9a96e]/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#c9a96e] mb-2">No Rankings Yet</h3>
          <p className="text-[#8a8a8a]">
            Be the first to claim your throne! Make a contribution to secure your position.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {rankings.map((ranking: RankingEntry, _index: number) => (
            <RankingCard
              key={`${ranking.user_id}-${page}-${search}`}
              entry={ranking}
            />
          ))}
        </div>
        
        <RankingPagination
          currentPage={page}
          totalPages={totalPages}
          search={search}
        />
      </div>
    )
  } catch (error) {
    console.error("Unexpected error in RankingListServer:", error)
    return (
      <div className="text-center py-12">
        <Crown className="h-16 w-16 text-[#c9a96e]/50 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-[#c9a96e] mb-2">Something went wrong</h3>
        <p className="text-[#8a8a8a]">
          An unexpected error occurred. Please refresh the page.
        </p>
      </div>
    )
  }
}
