"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateUserProfile(prevState: any, formData: FormData) {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Authentication required" }
    }

    // Validate form data
    const userId = formData.get("userId") as string
    const displayName = formData.get("displayName") as string
    const description = formData.get("description") as string
    const avatarFile = formData.get("avatar") as File

    if (userId !== user.id) {
      return { error: "Invalid user" }
    }

    let avatarUrl = null

    // Handle avatar upload (in a real app, you'd upload to Supabase Storage or similar)
    if (avatarFile && avatarFile.size > 0) {
      // For demo purposes, we'll use a placeholder
      // In a real app: const { data, error } = await supabase.storage.from('avatars').upload(`${userId}/${Date.now()}`, avatarFile)
      avatarUrl = `/placeholder.svg?height=100&width=100&query=user-avatar-${displayName || "user"}`
    }

    // Update or create user profile
    const profileData: any = {
      id: userId,
      display_name: displayName || null,
      description: description || null,
      updated_at: new Date().toISOString(),
    }

    if (avatarUrl) {
      profileData.avatar_url = avatarUrl
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
