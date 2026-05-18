import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const runtime = 'edge'

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; type?: string }>
}) {
  const params = await searchParams
  const code = params.code
  const type = params.type

  // Log ALL parameters to understand what Supabase is sending
  console.log('🔄 Auth Callback - ALL PARAMS received:', params)
  console.log('🔄 Auth Callback - Code present:', !!code)
  console.log('🔄 Auth Callback - Type:', type)

  if (code) {
    const supabase = await createClient()
    
    try {
      console.log('🔄 Auth Callback - About to exchange code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('🔄 Auth Callback - Exchange error:', error)
        console.error('🔄 Auth Callback - Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        
        // If it's an email change, still redirect but with error info
        if (type === 'email_change') {
          console.log('🔄 Auth Callback - Email change with error, redirecting to profile')
          redirect("/profile?email_changed=true&status=error")
        } else {
          redirect("/?error=auth_failed")
        }
      } else {
        console.log('🔄 Auth Callback - Exchange success:', {
          hasUser: !!data.user,
          userId: data.user?.id?.substring(0, 8) + '...',
          email: data.user?.email,
          emailConfirmedAt: data.user?.email_confirmed_at,
          lastSignInAt: data.user?.last_sign_in_at,
          userMetadata: data.user?.user_metadata,
          appMetadata: data.user?.app_metadata
        })

        // Handle successful callback
        if (type === 'email_change') {
          console.log('🔄 Auth Callback - Email change confirmed successfully')
          console.log('🔄 Final user email after exchange:', data.user?.email)
          
          // For email changes, redirect with a reload instruction
          redirect("/profile?email_changed=true&status=success&reload=true")
        } else {
          redirect("/")
        }
      }
    } catch (error) {
      console.error('🔄 Auth Callback - Exchange failed:', error)
      
      if (type === 'email_change') {
        redirect("/profile?email_changed=true&status=error")
      } else {
        redirect("/?error=auth_failed")
      }
    }
  } else {
    console.log('🔄 Auth Callback - No code provided')
    
    // Handle callback without code
    if (type === 'email_change') {
      redirect("/profile?email_changed=true&status=no_code")
    } else {
      redirect("/")
    }
  }
}
