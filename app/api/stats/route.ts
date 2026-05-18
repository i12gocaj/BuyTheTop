export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBaseUrl } from '@/lib/url-utils'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Obtener total de participantes
    const { count: totalParticipants } = await supabase
      .from("rankings")
      .select("*", { count: "exact", head: true })

    // Obtener total de contribuciones
    const { data: totalContributionsData } = await supabase
      .from("rankings")
      .select("total_contribution")

    const totalContributions = totalContributionsData?.reduce(
      (sum: number, entry: any) => sum + (Number(entry.total_contribution) || 0), 0
    ) || 0

    // Obtener actividad reciente con fallback
    let recentActivity = 0
    try {
      const response = await fetch(
        `${getBaseUrl()}/api/stats/24h-activity`,
        { 
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      if (response.ok) {
        const activityData = await response.json()
        recentActivity = Number(activityData.recentActivity) || 0
      }
    } catch (fetchError) {
      console.warn("Failed to fetch 24h activity, using fallback:", fetchError)
      recentActivity = 0
    }

    // Obtener top contributor
    const { data: topContributor } = await supabase
      .from("rankings")
      .select("total_contribution")
      .order("total_contribution", { ascending: false })
      .limit(1)
      .single()

    const stats = {
      totalParticipants: Number(totalParticipants) || 0,
      totalContributions: Number(totalContributions) || 0,
      recentActivity: Number(recentActivity) || 0,
      topAmount: Number(topContributor?.total_contribution) || 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching global stats:", error)
    
    // Fallback data
    const fallbackStats = {
      totalParticipants: 0,
      totalContributions: 0,
      recentActivity: 0,
      topAmount: 0,
    }

    return NextResponse.json(fallbackStats)
  }
}
