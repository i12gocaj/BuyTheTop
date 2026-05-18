export const runtime = 'edge'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Solo disponible en el servidor
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Sin NEXT_PUBLIC_
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Calcular fecha de hace 24 horas
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // Consultar actividad de 24h con service key (servidor)
    const { count: recentActivity, error } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterday.toISOString())
      .eq("status", "completed")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Retornar con headers de cache optimizados
    return NextResponse.json(
      { recentActivity },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate', // Sin caché para datos en tiempo real
        }
      }
    )
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
