"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { AlertTriangle, TrendingDown, Plus, Search, X, Target } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"

interface PositionAlertsProps {
  user: any
  userRanking: any
}

export default function PositionAlerts({ user, userRanking }: PositionAlertsProps) {
  const [userAhead, setUserAhead] = useState<any>(null)
  const [recentOvertakes, setRecentOvertakes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (!userRanking || !user || !supabase) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)

        // Get only the user immediately ahead (position - 1)
        if (userRanking.current_position > 1) {
          const { data: aheadData } = await supabase
            .from("rankings")
            .select(`
              user_id,
              total_contribution,
              current_position,
              position_acquired_at
            `)
            .eq("current_position", userRanking.current_position - 1)
            .single()

          if (aheadData) {
            // Get profile for the user ahead
            const { data: profileData } = await supabase
              .from("user_profiles")
              .select("display_name, avatar_url")
              .eq("id", aheadData.user_id)
              .single()

            setUserAhead({
              ...aheadData,
              display_name: profileData?.display_name || `User ${aheadData.user_id.substring(0, 8)}`,
              avatar_url: profileData?.avatar_url
            })
          }
        }

        // Get users who recently overtook this user
        try {
          const response = await fetch('/api/position-history?type=overtakes&limit=3', {
            credentials: 'include'
          })
          
          if (response.ok) {
            const result = await response.json()
            setRecentOvertakes(result.data || [])
          } else {
            console.warn("Position overtakes API returned error:", response.status)
            setRecentOvertakes([])
          }
        } catch (error) {
          console.error("Position overtakes fetch failed:", error)
          setRecentOvertakes([])
        }
      } catch (error) {
        console.error("Error loading position alerts data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, userRanking])

  // Search for users by display name or position
  useEffect(() => {
    if (!searchTerm.trim() || !supabase) {
      setSearchResults([])
      return
    }

    const searchUsers = async () => {
      setSearchLoading(true)
      try {
        // Search by display name
        const { data: profilesData } = await supabase
          .from("user_profiles")
          .select("id, display_name, avatar_url")
          .ilike("display_name", `%${searchTerm}%`)
          .limit(5)

        if (profilesData && profilesData.length > 0) {
          const userIds = profilesData.map((p: any) => p.id)
          const { data: rankingsData } = await supabase
            .from("rankings")
            .select("user_id, total_contribution, current_position")
            .in("user_id", userIds)
            .not("current_position", "is", null)
            .order("current_position", { ascending: true })

          if (rankingsData) {
            const enrichedResults = rankingsData.map((ranking: any) => {
              const profile = profilesData.find((p: any) => p.id === ranking.user_id)
              return {
                ...ranking,
                display_name: profile?.display_name || `User ${ranking.user_id.substring(0, 8)}`,
                avatar_url: profile?.avatar_url
              }
            })
            setSearchResults(enrichedResults)
          }
        } else {
          // If no name match, try searching by position number
          const positionNumber = parseInt(searchTerm)
          if (!isNaN(positionNumber) && positionNumber > 0) {
            const { data: rankingData } = await supabase
              .from("rankings")
              .select("user_id, total_contribution, current_position")
              .eq("current_position", positionNumber)
              .single()

            if (rankingData) {
              const { data: profileData } = await supabase
                .from("user_profiles")
                .select("display_name, avatar_url")
                .eq("id", rankingData.user_id)
                .single()

              setSearchResults([{
                ...rankingData,
                display_name: profileData?.display_name || `User ${rankingData.user_id.substring(0, 8)}`,
                avatar_url: profileData?.avatar_url
              }])
            } else {
              setSearchResults([])
            }
          } else {
            setSearchResults([])
          }
        }
      } catch (error) {
        console.error("Error searching users:", error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }

    const delayedSearch = setTimeout(searchUsers, 300)
    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  if (!userRanking) {
    return (
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" />
            Estado de Posición
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-yellow-700/50 bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-400">
              You haven&apos;t joined the ranking yet. Make your first contribution to secure your position.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Link href="/contribute">
              <Button className="w-full bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] font-medium">
                <Plus className="mr-2 h-4 w-4" />
                Join the Ranking
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" />
            Estado de Posición
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#c9a96e]"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const calculateAmountToOvertake = (targetContribution: number) => {
    const amountNeeded = targetContribution - userRanking.total_contribution + 0.01
    return Math.max(0.01, amountNeeded)
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardHeader>
        <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
          <AlertTriangle className="mr-2 h-6 w-6" />
          Position Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recent Overtakes */}
        {recentOvertakes && recentOvertakes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-[#c9a96e] mb-3 flex items-center">
              <TrendingDown className="mr-2 h-5 w-5" />
              Recent Overtakes
            </h3>
            <div className="space-y-3">
              {recentOvertakes.map((overtake: any) => (
                <Alert key={overtake.id} className="border-red-700/50 bg-red-900/20">
                  <TrendingDown className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-400">
                    <strong>{overtake.user_profiles?.display_name || "Anonymous"}</strong> overtook you with a{" "}
                    {formatCurrency(overtake.contribution_amount)} contribution on{" "}
                    {new Date(overtake.created_at).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* User Immediately Ahead */}
        {userAhead && (
          <div>
            <h3 className="text-lg font-semibold text-[#c9a96e] mb-3 flex items-center">
              <Target className="mr-2 h-5 w-5" />
              User to Overtake
            </h3>
            <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-[#e5e5e5]">#{userAhead.current_position}</span>
                  <span className="ml-2 text-[#8a8a8a]">{userAhead.display_name}</span>
                </div>
                <span className="text-[#c9a96e]">{formatCurrency(userAhead.total_contribution)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#666]">To overtake: {formatCurrency(calculateAmountToOvertake(userAhead.total_contribution))}</span>
                <Link href={`/contribute?target=${userAhead.total_contribution}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#c9a96e] text-[#c9a96e] hover:bg-[#c9a96e] hover:text-[#0a0a0a] bg-transparent"
                  >
                    Overtake
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Position Search */}
        <div>
          <h3 className="text-lg font-semibold text-[#c9a96e] mb-3 flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Position Search
          </h3>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#666]" />
              <Input
                type="text"
                placeholder="Search by name or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 bg-[#1a1a1a] border-[#333] text-[#e5e5e5] placeholder:text-[#666] focus:border-[#c9a96e]/50"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-[#333]/50"
                >
                  <X className="h-3 w-3 text-[#666] hover:text-[#c9a96e]" />
                </Button>
              )}
            </div>
            
            {searchLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#c9a96e]"></div>
                <span className="ml-2 text-sm text-[#8a8a8a]">Searching...</span>
              </div>
            )}

            {searchResults.length > 0 && !searchLoading && (
              <div className="space-y-2">
                {searchResults.map((result: any) => {
                  const amountToOvertake = calculateAmountToOvertake(result.total_contribution)
                  const canOvertake = result.current_position < userRanking.current_position
                  
                  return (
                    <div key={result.user_id} className="bg-[#0a0a0a] p-3 rounded-lg border border-[#333]">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold text-[#e5e5e5]">#{result.current_position}</span>
                          <span className="ml-2 text-[#8a8a8a]">{result.display_name}</span>
                          {result.user_id === user.id && (
                            <span className="ml-2 text-xs text-[#c9a96e]">(You)</span>
                          )}
                        </div>
                        <span className="text-[#c9a96e] text-sm">{formatCurrency(result.total_contribution)}</span>
                      </div>
                      {canOvertake && result.user_id !== user.id && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#666]">To overtake: {formatCurrency(amountToOvertake)}</span>
                          <Link href={`/contribute?target=${result.total_contribution}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs border-[#c9a96e] text-[#c9a96e] hover:bg-[#c9a96e] hover:text-[#0a0a0a] bg-transparent"
                            >
                              Overtake
                            </Button>
                          </Link>
                        </div>
                      )}
                      {!canOvertake && result.user_id !== user.id && (
                        <div className="text-xs text-[#666]">
                          This user is behind you in the ranking
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {searchTerm && searchResults.length === 0 && !searchLoading && (
              <div className="text-center py-4 text-sm text-[#666]">
                No results found for "{searchTerm}"
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-[#333]">
          <h3 className="text-lg font-semibold text-[#c9a96e] mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/contribute">
              <Button className="w-full bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] font-medium">
                <Plus className="mr-2 h-4 w-4" />
                Add Capital
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                className="w-full border-[#333] text-[#8a8a8a] hover:border-[#c9a96e] hover:text-[#c9a96e] hover:bg-[#1a1a1a] bg-transparent"
              >
                View Ranking
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
