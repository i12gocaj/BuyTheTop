export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // TODO: Implementar lógica de forzar actualización de email
    // Este endpoint está pendiente de implementación
    
    return NextResponse.json(
      { error: 'Endpoint not implemented yet' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Force email update error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}