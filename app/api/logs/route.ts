// Endpoint para ver logs en tiempo real desde el navegador
// GET /api/logs

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getLogs, clearLogs, getLogCount } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clear = searchParams.get('clear')
  
  if (clear === 'true') {
    clearLogs()
    return NextResponse.json({ 
      message: 'Logs cleared',
      logs: [],
      timestamp: new Date().toISOString()
    })
  }
  
  return NextResponse.json({
    logs: getLogs(),
    count: getLogCount(),
    timestamp: new Date().toISOString()
  })
}
