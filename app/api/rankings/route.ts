export const runtime = 'edge'

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { SearchSchema, sanitizeHtml } from '@/lib/validation'
import { checkRateLimit, getRateLimitHeaders, rateLimitConfigs } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with service role key for server-side operations
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

    // Apply rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 'localhost'
    const rateLimitResult = checkRateLimit(ip, 'search')
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: getRateLimitHeaders(
          rateLimitResult.remaining,
          rateLimitResult.resetTime,
          rateLimitConfigs.search.maxRequests
        )
      })
    }
    
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const validatedParams = SearchSchema.parse({
      page: searchParams.get('page') || '1',
      search: searchParams.get('search') || '',
      limit: searchParams.get('limit') || '10'
    })
    
    const { page, search, limit } = validatedParams
    const itemsPerPage = Math.min(limit, 50) // Cap at 50 items per page

    // Sanitize search input
    const sanitizedSearch = search ? sanitizeHtml(search.trim()) : ''

    // OPTIMIZACIÓN: Usar 2 consultas optimizadas en lugar de N+1
    const { data: rankingsData, error: rankError } = await supabase
      .from('rankings')
      .select(`
        user_id,
        total_contribution,
        current_position,
        position_acquired_at
      `)
      .not('current_position', 'is', null)
      .order('current_position', { ascending: true })
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

    if (rankError) {
      return NextResponse.json(
        { error: `Rankings query failed: ${rankError.message}` },
        { status: 500 }
      )
    }

    if (!rankingsData || rankingsData.length === 0) {
      return NextResponse.json({
        data: [],
        count: 0,
        error: null,
      })
    }

    // OPTIMIZACIÓN: Obtener todos los perfiles en una sola consulta
    const userIds = rankingsData.map(ranking => ranking.user_id)
    const { data: profilesData, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, display_name, description, avatar_url')
      .in('id', userIds)

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

    // Filtrar por búsqueda si se proporciona
    let filteredRankings = rankingsData
    
    if (sanitizedSearch) {
      const searchLower = sanitizedSearch.toLowerCase()
      filteredRankings = rankingsData.filter(ranking => {
        const profile = profilesMap.get(ranking.user_id)
        const displayName = profile?.display_name || `User ${ranking.user_id.substring(0, 8)}`
        const description = profile?.description || ''
        
        return displayName.toLowerCase().includes(searchLower) ||
               description.toLowerCase().includes(searchLower)
      })
    }

    // Obtener count total (si hay búsqueda, contar solo los resultados filtrados)
    let totalCount = 0
    if (sanitizedSearch) {
      // Para búsquedas, necesitamos obtener todos los rankings y perfiles para filtrar correctamente
      const { data: allRankingsData, error: allRankError } = await supabase
        .from('rankings')
        .select(`
          user_id,
          total_contribution,
          current_position,
          position_acquired_at
        `)
        .not('current_position', 'is', null)
        .order('current_position', { ascending: true })

      if (!allRankError && allRankingsData) {
        const allUserIds = allRankingsData.map(ranking => ranking.user_id)
        const { data: allProfilesData, error: allProfileError } = await supabase
          .from('user_profiles')
          .select('id, display_name, description, avatar_url')
          .in('id', allUserIds)

        if (!allProfileError && allProfilesData) {
          const allProfilesMap = new Map()
          allProfilesData.forEach(profile => {
            allProfilesMap.set(profile.id, profile)
          })

          const searchLower = sanitizedSearch.toLowerCase()
          totalCount = allRankingsData.filter(ranking => {
            const profile = allProfilesMap.get(ranking.user_id)
            const displayName = profile?.display_name || `User ${ranking.user_id.substring(0, 8)}`
            const description = profile?.description || ''
            
            return displayName.toLowerCase().includes(searchLower) ||
                   description.toLowerCase().includes(searchLower)
          }).length
        }
      }
    } else {
      // Sin búsqueda, usar el count normal
      const { count } = await supabase
        .from('rankings')
        .select('user_id', { count: 'exact', head: true })
        .not('current_position', 'is', null)
      totalCount = count || 0
    }

    // Mapear resultados finales
    const rankings = filteredRankings.map(ranking => {
      const profile = profilesMap.get(ranking.user_id)
      const displayName = profile?.display_name || `User ${ranking.user_id.substring(0, 8)}`
      const description = profile?.description || ''

      return {
        user_id: ranking.user_id,
        display_name: displayName,
        description: description,
        avatar_url: profile?.avatar_url || null,
        total_contribution: parseFloat(ranking.total_contribution) || 0,
        current_position: ranking.current_position,
        position_acquired_at: ranking.position_acquired_at,
        days_in_position: Math.floor(
          (new Date().getTime() - new Date(ranking.position_acquired_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }
    })

    return NextResponse.json({
      data: rankings,
      count: totalCount || 0,
      error: null,
    }, {
      headers: getRateLimitHeaders(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
        rateLimitConfigs.search.maxRequests
      )
    })

  } catch (error) {
    console.error('API Error:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.message },
        { status: 400 }
      )
    }

    // Handle rate limit errors
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          undefined
      },
      { status: 500 }
    )
  }
}
