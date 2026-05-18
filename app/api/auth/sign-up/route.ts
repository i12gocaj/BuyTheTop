export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getBaseUrl } from "@/lib/url-utils"
import { sendConfirmationEmailDirect } from "@/lib/email-actions"

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  const logPrefix = `🌐 [${timestamp}] API /auth/sign-up`
  
  try {
    console.log(`${logPrefix}: === INICIANDO REGISTRO VIA API ===`)
    
    const cookieStore = await cookies()
    const { email, password } = await request.json()

    console.log(`${logPrefix}: Email recibido: ${email}`)
    console.log(`${logPrefix}: Password recibido: ${password ? 'Sí' : 'No'}`)

    if (!email || !password) {
      console.error(`${logPrefix}: ❌ Email y password requeridos`)
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Create supabase server client
    console.log(`${logPrefix}: 🔧 Creando cliente Supabase...`)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      }
    )

    console.log(`${logPrefix}: 👤 Creando usuario en Supabase sin confirmación automática...`)
    
    // Crear usuario normal (sin confirmación requerida)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // NO redirect automático
        data: {
          email_confirmed: false, // Marcar como no confirmado
          registration_source: 'website',
          pending_confirmation: true // Flag personalizado
        }
      },
    })

    console.log(`${logPrefix}: 👤 Resultado Supabase:`, {
      hasUser: !!data.user,
      userId: data.user?.id?.substring(0, 8) + '...',
      hasError: !!error,
      errorMessage: error?.message,
      hasSession: !!data.session
    })

    if (error) {
      console.error(`${logPrefix}: ❌ Error Supabase: ${error.message}`)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // ⚠️ IMPORTANTE: Supabase automáticamente inicia sesión después del registro
    // Necesitamos cerrar la sesión para forzar confirmación de email
    if (data.session) {
      console.log(`${logPrefix}: 🚪 Cerrando sesión automática para forzar confirmación...`)
      await supabase.auth.signOut()
      console.log(`${logPrefix}: ✅ Sesión cerrada exitosamente`)
    }

    console.log(`${logPrefix}: ✅ Usuario creado, creando registro de confirmación...`)

    // Crear entrada en tabla de confirmaciones si el usuario fue creado
    if (data.user) {
      try {
        const { error: confirmationError } = await supabase
          .from('email_confirmations')
          .insert({
            user_id: data.user.id,
            email: email,
            confirmed_at: null // Pendiente de confirmación
          })

        if (confirmationError) {
          console.error(`${logPrefix}: ⚠️ Error creando registro de confirmación:`, confirmationError)
          // No fallar el registro por esto
        } else {
          console.log(`${logPrefix}: ✅ Registro de confirmación creado`)
        }
      } catch (confirmationErr) {
        console.error(`${logPrefix}: ⚠️ Excepción creando confirmación:`, confirmationErr)
      }
    }

    console.log(`${logPrefix}: 📧 Enviando email personalizado...`)

    // Enviar email de confirmación personalizado
    try {
      const emailResult = await sendConfirmationEmailDirect({
        email
      })

      console.log(`${logPrefix}: 📧 Resultado email:`, emailResult)

      if (!emailResult.success) {
        console.error(`${logPrefix}: ❌ Error enviando email: ${emailResult.error}`)
        return NextResponse.json({
          error: "Account created but failed to send confirmation email. Please contact support.",
          partialSuccess: true
        }, { status: 500 })
      }

      console.log(`${logPrefix}: ✅ Email enviado exitosamente`)
      console.log(`${logPrefix}: === REGISTRO COMPLETADO ===`)

      return NextResponse.json({
        success: "Registration successful! Check your email to confirm your account.",
        user: data.user,
      })
    } catch (emailError) {
      console.error(`${logPrefix}: ❌ Excepción enviando email:`, emailError)
      return NextResponse.json({
        error: "Account created but failed to send confirmation email. Please contact support.",
        partialSuccess: true
      }, { status: 500 })
    }

  } catch (error) {
    console.error(`${logPrefix}: ❌ Excepción general:`, error)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}
