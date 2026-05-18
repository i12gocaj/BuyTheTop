export const runtime = 'edge'

import { handleCSRFToken } from '@/lib/csrf-protection'

/**
 * GET /api/csrf-token
 * Returns a CSRF token for the client
 */
export async function GET() {
  return await handleCSRFToken()
}
