"use client"

import { useState } from "react"
import { Crown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RankingSearchWrapperProps {
  initialSearch?: string
}

export default function RankingSearchWrapper({ initialSearch = "" }: RankingSearchWrapperProps) {
  const [search, setSearch] = useState(initialSearch)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      window.location.href = `/?search=${encodeURIComponent(search.trim())}`
    } else {
      window.location.href = "/"
    }
  }

  const clearSearch = () => {
    setSearch("")
    window.location.href = "/"
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search participants..."
          className="w-full px-4 py-3 pl-10 pr-20 bg-[#1a1a1a] border border-[#333] rounded-lg text-[#e5e5e5] placeholder-[#8a8a8a] focus:outline-none focus:border-[#c9a96e] focus:ring-2 focus:ring-[#c9a96e]/20 transition-all duration-200"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Crown className="h-5 w-5 text-[#8a8a8a]" />
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
          {search && (
            <Button
              type="button"
              onClick={clearSearch}
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-[#8a8a8a] hover:text-[#c9a96e]"
            >
              ×
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            className="h-7 w-7 p-0 bg-[#c9a96e] hover:bg-[#c9a96e]/80 text-black"
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>
      </form>
    </div>
  )
}
