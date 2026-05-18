"use client"

import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface RankingSearchProps {
  initialSearch: string
}

export default function RankingSearch({ initialSearch }: RankingSearchProps) {
  const [search, setSearch] = useState(initialSearch)

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (search) {
        window.location.href = `/?search=${encodeURIComponent(search)}&page=1`
      } else {
        window.location.href = "/"
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [search])

  const clearSearch = () => {
    setSearch("")
  }

  return (
    <div className="relative max-w-lg mx-auto px-4">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#c9a96e]/20 via-[#c9a96e]/10 to-[#c9a96e]/20 rounded-xl blur-sm group-focus-within:blur-md group-focus-within:opacity-75 transition-all duration-300"></div>
        <div className="relative">
          <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-[#c9a96e] group-focus-within:text-[#c9a96e] transition-colors duration-300 z-10" />
          <Input
            type="text"
            placeholder="Search elite participants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 lg:pl-12 pr-10 lg:pr-12 py-3 lg:py-4 text-base lg:text-lg bg-[#1a1a1a]/80 backdrop-blur-sm border-[#333] text-[#e5e5e5] placeholder:text-[#666] focus:border-[#c9a96e]/50 focus:ring-2 focus:ring-[#c9a96e]/20 rounded-xl transition-all duration-300 hover:bg-[#1a1a1a] hover:border-[#c9a96e]/30"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 lg:h-8 lg:w-8 p-0 hover:bg-[#333]/50 rounded-lg transition-all duration-300 hover:text-[#c9a96e]"
            >
              <X className="h-3 w-3 lg:h-4 lg:w-4 text-[#666] hover:text-[#c9a96e] transition-colors duration-300" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
