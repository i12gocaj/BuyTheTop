import { createClient as createServerClient } from "@/lib/supabase/server"
import { getSupabaseClient as getBrowserClient } from "@/lib/supabase/client"
import { createClient } from '@supabase/supabase-js'

export interface RankingEntry {
  user_id: string
  display_name: string
  description: string | null
  avatar_url: string | null
  total_contribution: number
  current_position: number
  position_acquired_at: string
  days_in_position: number
}

export interface UserProfile {
  id: string
  display_name: string | null
  description: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UserRanking {
  id: string
  user_id: string
  total_contribution: number
  current_position: number | null
  position_acquired_at: string
  created_at: string
  updated_at: string
}

// Helper function to get supabase client (server or browser)
function getSupabaseClient() {
  if (typeof window !== 'undefined') {
    // Browser - use browser client
    return getBrowserClient()
  } else {
    // Server - use server client
    return createServerClient()
  }
}

export async function getRankingWithProfiles(
  page = 1,
  search = "",
  itemsPerPage = 10,
): Promise<{ data: RankingEntry[] | null; count: number; error: any }> {
  try {
    // If running in the browser, use the API route
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        search: search,
      })
      
      const response = await fetch(`/api/rankings?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Add timeout and retry logic
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const result = await response.json()
      return result
    }
    
    // If running on the server, use direct database access with service role
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

    // OPTIMIZACIÓN: Consulta con menos requests pero sin JOIN (ya que no hay FK configurada)
    const { data: rankingsData, error: rankError } = await supabase
      .from("rankings")
      .select(`
        user_id,
        total_contribution,
        current_position,
        position_acquired_at
      `)
      .not("current_position", "is", null)
      .order("current_position", { ascending: true })
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

    if (rankError) {
      throw new Error(`Rankings query failed: ${rankError.message}`)
    }

    if (!rankingsData || rankingsData.length === 0) {
      return {
        data: [],
        count: 0,
        error: null,
      }
    }

    // OPTIMIZACIÓN: Obtener todos los perfiles en una sola consulta
    const userIds = rankingsData.map(ranking => ranking.user_id)
    const { data: profilesData, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, display_name, description, avatar_url")
      .in("id", userIds)

    if (profileError) {
      console.warn("Error fetching profiles:", profileError.message)
    }

    // Crear un mapa de perfiles para acceso rápido
    const profilesMap = new Map()
    if (profilesData) {
      profilesData.forEach(profile => {
        profilesMap.set(profile.id, profile)
      })
    }

    // Mapear y filtrar los resultados
    const rankings: RankingEntry[] = []
    
    for (const rankingItem of rankingsData) {
      const profile = profilesMap.get(rankingItem.user_id)
      
      // Use real profile data if available, otherwise use a simple fallback based on user_id
      const displayName = profile?.display_name || `User ${rankingItem.user_id.substring(0, 8)}`;
      const description = profile?.description || '';
      
      // Apply search filter if provided
      if (search && search.trim()) {
        const searchLower = search.toLowerCase()
        const matchesSearch = 
          displayName.toLowerCase().includes(searchLower) ||
          (description && description.toLowerCase().includes(searchLower))
        
        if (!matchesSearch) {
          continue // Skip this entry if it doesn't match search
        }
      }

      rankings.push({
        user_id: rankingItem.user_id,
        display_name: displayName,
        description: description,
        avatar_url: profile?.avatar_url || null,
        total_contribution: Number.parseFloat(rankingItem.total_contribution) || 0,
        current_position: rankingItem.current_position,
        position_acquired_at: rankingItem.position_acquired_at,
        days_in_position: Math.floor(
          (new Date().getTime() - new Date(rankingItem.position_acquired_at).getTime()) / (1000 * 60 * 60 * 24),
        ),
      })
    }

    // Get total count for pagination (considerando el filtro de búsqueda)
    let totalCount = 0
    if (search && search.trim()) {
      // Para búsquedas, necesitamos obtener todos los rankings y perfiles para contar correctamente
      const { data: allRankingsData, error: allRankError } = await supabase
        .from("rankings")
        .select(`
          user_id,
          total_contribution,
          current_position,
          position_acquired_at
        `)
        .not("current_position", "is", null)
        .order("current_position", { ascending: true })

      if (!allRankError && allRankingsData) {
        const allUserIds = allRankingsData.map(ranking => ranking.user_id)
        const { data: allProfilesData, error: allProfileError } = await supabase
          .from("user_profiles")
          .select("id, display_name, description, avatar_url")
          .in("id", allUserIds)

        if (!allProfileError && allProfilesData) {
          const allProfilesMap = new Map()
          allProfilesData.forEach(profile => {
            allProfilesMap.set(profile.id, profile)
          })

          const searchLower = search.toLowerCase()
          totalCount = allRankingsData.filter(rankingItem => {
            const profile = allProfilesMap.get(rankingItem.user_id)
            const displayName = profile?.display_name || `User ${rankingItem.user_id.substring(0, 8)}`
            const description = profile?.description || ''
            
            return displayName.toLowerCase().includes(searchLower) ||
                   (description && description.toLowerCase().includes(searchLower))
          }).length
        }
      }
    } else {
      // Sin búsqueda, usar el count normal
      const { count } = await supabase
        .from("rankings")
        .select("user_id", { count: "exact", head: true })
        .not("current_position", "is", null)
      totalCount = count || 0
    }

    return {
      data: rankings,
      count: totalCount,
      error: null,
    }
  } catch (error) {
    console.error("Database connection failed:", error)
    return {
      data: null,
      count: 0,
      error: "Could not connect to database. Please check your internet connection and try again.",
    }
  }

  // If we reach here, something went wrong
  return {
    data: null,
    count: 0,
    error: "Unable to fetch rankings from database",
  }
}

export async function getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
  try {
    const supabase = typeof window !== 'undefined' ? 
      getSupabaseClient() : 
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    
    if (!supabase) {
      throw new Error("Supabase client not available")
    }
    
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()
    return { data, error }
  } catch {
    return { data: null, error: "Database not accessible" }
  }
}

export async function getUserRanking(userId: string): Promise<{ data: UserRanking | null; error: any }> {
  try {
    const supabase = typeof window !== 'undefined' ? 
      getSupabaseClient() : 
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    
    if (!supabase) {
      throw new Error("Supabase client not available")
    }
    
    const { data, error } = await supabase.from("rankings").select("*").eq("user_id", userId).single()
    return { data, error }
  } catch {
    return { data: null, error: "Database not accessible" }
  }
}

export async function createOrUpdateUserProfile(
  userId: string,
  profile: Partial<UserProfile>,
): Promise<{ data: UserProfile | null; error: any }> {
  try {
    const supabase = typeof window !== 'undefined' ? 
      getSupabaseClient() : 
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    
    if (!supabase) {
      throw new Error("Supabase client not available")
    }
    
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          id: userId,
          ...profile,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      )
      .select()
      .single()

    return { data, error }
  } catch {
    return { data: null, error: "Database not accessible" }
  }
}
