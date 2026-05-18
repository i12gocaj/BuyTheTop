"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { getBaseUrl } from "@/lib/url-utils"
import { sendConfirmationEmailDirect, sendPasswordResetEmailDirect } from "@/lib/email-actions"

// Create Supabase client for Server Actions
function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      console.error("Sign in error:", error)
      
      // Handle specific error cases
      if (error.message.includes('Email not confirmed') || error.code === 'email_not_confirmed') {
        return { 
          error: "Email not confirmed. Please check your email for a confirmation link, or contact support if you need help.",
          emailNotConfirmed: true
        }
      }
      
      if (error.message.includes('Invalid login credentials')) {
        return { error: "Invalid email or password. Please check your credentials and try again." }
      }
      
      return { error: error.message }
    }

    if (data.user) {
      console.log("User signed in successfully:", data.user.email)
      
      // Verificar si el email está confirmado en nuestra tabla personalizada
      try {
        const { data: confirmationData, error: confirmationError } = await supabase
          .from('email_confirmations')
          .select('confirmed_at, user_id, email')
          .eq('user_id', data.user.id)
          .single()

        console.log("Checking email confirmation for user ID:", data.user.id, "Email:", data.user.email, "Result:", confirmationData)

        if (confirmationError && confirmationError.code !== 'PGRST116') {
          console.error("Error checking email confirmation:", confirmationError)
          // Continuar con el login aunque no podamos verificar
        } else if (confirmationData) {
          if (!confirmationData.confirmed_at) {
            // Email no confirmado - sign out para limpiar la sesión
            console.log("Email not confirmed for user:", data.user.email, "User ID:", data.user.id, "- signing out")
            await supabase.auth.signOut()
            
            return { 
              error: "Please confirm your email address before signing in. Check your inbox for a confirmation link.",
              emailNotConfirmed: true
            }
          } else {
            console.log("Email confirmed at:", confirmationData.confirmed_at, "for user:", data.user.email)
          }
        } else {
          // No hay entrada de confirmación, asumir que es un usuario antiguo
          console.log("No confirmation record found for user ID:", data.user.id, "- assuming legacy user, allowing login")
        }
      } catch (confirmationCheckError) {
        console.error("Exception checking email confirmation:", confirmationCheckError)
        // Continuar con el login en caso de error
      }
      
      revalidatePath("/", "layout")
      return { success: "Login successful", user: data.user }
    } else {
      return { error: "No user data returned" }
    }
  } catch (error) {
    console.error("Unexpected sign in error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  console.log('🚀 SignUp: Iniciando proceso de registro...')
  
  if (!formData) {
    console.error('❌ SignUp: Form data is missing')
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  console.log('📧 SignUp: Email recibido:', email)
  console.log('🔒 SignUp: Password recibido:', password ? 'Sí' : 'No')

  if (!email || !password) {
    console.error('❌ SignUp: Email and password are required')
    return { error: "Email and password are required" }
  }

  try {
    console.log('👤 SignUp: Intentando crear usuario en Supabase...')
    
    const supabase = createServerSupabaseClient()
    
    // Crear usuario SIN confirmación automática de email
    const { data, error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo: undefined, // No redirect automático
        data: {
          email_confirm: false // Desactivar confirmación automática
        }
      },
    })

    console.log('👤 SignUp: Resultado de Supabase:', {
      hasUser: !!data.user,
      userId: data.user?.id?.substring(0, 8) + '...',
      hasError: !!error,
      errorMessage: error?.message
    })

    if (error) {
      console.error('❌ SignUp: Error creando usuario:', error.message)
      return { error: error.message }
    }

    console.log('✅ SignUp: Usuario creado exitosamente, enviando email...')

    // Enviar email de confirmación personalizado usando método directo
    try {
      console.log('📧 SignUp: Llamando sendConfirmationEmailDirect...')
      
      const result = await sendConfirmationEmailDirect({
        email: email.toString()
      })

      console.log('📧 SignUp: Resultado del email:', result)

      if (!result.success) {
        console.error('❌ SignUp: Error sending confirmation email:', result.error)
        return { 
          error: "Account created but failed to send confirmation email. Please contact support.",
          partialSuccess: true 
        }
      }

      console.log('✅ SignUp: Email enviado exitosamente')

      return { 
        success: "Registration successful! Check your email to confirm your account with our professional design."
      }
    } catch (emailError) {
      console.error("❌ SignUp: Error sending confirmation email:", emailError)
      return { 
        error: "Account created but failed to send confirmation email. Please contact support.",
        partialSuccess: true 
      }
    }

  } catch (error) {
    console.error("❌ SignUp: Unexpected error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = createServerSupabaseClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  return { success: "Signed out successfully" }
}

export async function forgotPassword(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")

  if (!email) {
    return { error: "Email is required" }
  }

  try {
    console.log('📧 Iniciando reset de contraseña para:', email.toString())
    
    const result = await sendPasswordResetEmailDirect({
      email: email.toString()
    })

    if (!result.success) {
      console.error('📧 Error sending password reset email:', result.error)
      return { 
        error: "Failed to send password reset email. Please try again later."
      }
    }

    console.log('✅ Password reset email sent successfully to:', email.toString())

    return { 
      success: "We've sent you a professional password reset link. Please check your email." 
    }
  } catch (error) {
    console.error("Password reset error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function resetPassword(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const password = formData.get("password")

  if (!password) {
    return { error: "Password is required" }
  }

  if (password.toString().length < 6) {
    return { error: "Password must be at least 6 characters long" }
  }

  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.auth.updateUser({
      password: password.toString()
    })

    if (error) {
      console.error("Password update error:", error)
      return { error: error.message }
    }

    revalidatePath("/", "layout")
    return { success: "Password updated successfully!" }
  } catch (error) {
    console.error("Password update error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
