"use server"

import { createClient } from "@/lib/supabase/server"
import { ProfileUpdateSchema } from "@/lib/validation"
// import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/image-validation"
import { z } from "zod"

export async function updateUserProfile(prevState: any, formData: FormData) {
  console.log('🔐 Update profile - Creating Supabase client')
  const supabase = await createClient()

  try {
    // Get current user
    console.log('🔐 Update profile - Getting user')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log('🔐 Update profile - User result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      error: userError?.message 
    })

    if (userError || !user) {
      console.error('🔐 Update profile - Authentication failed:', userError)
      return { error: "Authentication required" }
    }

    // Validate user ID
    const userId = formData.get("userId") as string
    if (userId !== user.id) {
      return { error: "Invalid user" }
    }

    // Extract and validate text fields
    const displayName = formData.get("displayName") as string
    const description = formData.get("description") as string

    // Validate profile data with Zod
    try {
      const _validatedData = ProfileUpdateSchema.parse({
        display_name: displayName,
        bio: description,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { error: error.errors[0]?.message || "Invalid profile data" }
      }
      return { error: "Validation failed" }
    }

    const _avatarUrl = null

    // Handle avatar upload with security validation
    const avatarFile = formData.get("avatar") as File
    if (avatarFile && avatarFile.size > 0) {
      // NOTA: El avatar upload ahora se maneja por separado a través de /api/upload-avatar
      // Este código se mantiene por compatibilidad pero no debería recibir archivos grandes
      return { error: "Avatar upload should be handled separately through the API endpoint" }
    }

    // Update or create user profile (sin avatar upload)
    const profileData: any = {
      id: user.id,
      display_name: displayName?.trim() || null,
      description: description?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { error: profileError } = await supabase.from("user_profiles").upsert(profileData, {
      onConflict: "id",
    })

    if (profileError) {
      console.error("Profile update error:", profileError)
      return { error: "Failed to update profile" }
    }

    return { success: "Profile updated successfully!" }
  } catch (error) {
    console.error("Profile update error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
