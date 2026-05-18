"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface RankingPaginationProps {
  currentPage: number
  totalPages: number
  search: string
}

export default function RankingPagination({ currentPage, totalPages, search }: RankingPaginationProps) {
  if (totalPages <= 1) return null

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    if (search) {
      params.set("search", search)
    }
    return `/?${params.toString()}`
  }

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      <Link href={createPageUrl(Math.max(1, currentPage - 1))}>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === 1}
          className="text-[#8a8a8a] hover:text-[#c9a96e] hover:bg-[#1a1a1a] disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
      </Link>

      <div className="flex items-center space-x-1">
        {getVisiblePages().map((page, index) => (
          <div key={index}>
            {page === "..." ? (
              <span className="px-3 py-2 text-[#666]">...</span>
            ) : (
              <Link href={createPageUrl(page as number)}>
                <Button
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  className={
                    currentPage === page
                      ? "bg-[#c9a96e] text-[#0a0a0a] hover:bg-[#b8956a]"
                      : "text-[#8a8a8a] hover:text-[#c9a96e] hover:bg-[#1a1a1a]"
                  }
                >
                  {page}
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>

      <Link href={createPageUrl(Math.min(totalPages, currentPage + 1))}>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === totalPages}
          className="text-[#8a8a8a] hover:text-[#c9a96e] hover:bg-[#1a1a1a] disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </Link>
    </div>
  )
}
