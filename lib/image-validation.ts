import { z } from 'zod'

// Image validation constants
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
export const ALLOWED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const MIN_FILE_SIZE = 100 // 100 bytes minimum
export const MAX_FILENAME_LENGTH = 255
// Dimensiones recomendadas para avatares (para mejor visualización)
export const RECOMMENDED_AVATAR_SIZE = {
  width: 400,
  height: 400,
  description: "400x400px recommended for optimal display"
}
// Dimensiones máximas permitidas
export const MAX_IMAGE_DIMENSIONS = {
  width: 4096,
  height: 4096
}

// Image validation schema
export const ImageUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size >= MIN_FILE_SIZE, 'File is too small (minimum 100 bytes)')
    .refine((file) => file.size <= MAX_FILE_SIZE, 'File size must be less than 5MB')
    .refine(
      (file) => ALLOWED_IMAGE_TYPES.includes(file.type as any),
      'File must be a valid image (JPEG, PNG, GIF, or WebP)'
    )
    .refine(
      (file) => file.name.length <= MAX_FILENAME_LENGTH,
      'Filename too long'
    )
    .refine(
      (file) => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase()
        return ALLOWED_FILE_EXTENSIONS.includes(extension as any)
      },
      'File extension not allowed'
    )
    .refine(
      (file) => !file.name.includes('..') && !file.name.includes('/') && !file.name.includes('\\'),
      'Invalid filename characters'
    )
})

/**
 * Validate image file on the client side
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  try {
    ImageUploadSchema.parse({ file })
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid file' }
    }
    return { valid: false, error: 'Unknown validation error' }
  }
}

/**
 * Additional security check for file content
 */
export function isSecureFilename(filename: string): boolean {
  // Verificar caracteres peligrosos
  const dangerousPatterns = [
    /\.\./,           // Directory traversal
    /[<>:"|?*]/,      // Windows reserved characters  
    /[\x00-\x1f]/,    // Control characters
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
    /^\./,            // Hidden files (starting with dot)
    /\.$|\ $/,        // Ending with dot or space
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(filename))
}

/**
 * Validate that the file is a valid image (optional - mainly for better UX)
 * Since file size already controls quality, we just verify it's loadable
 */
export function validateImageDimensions(file: File): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      // Verificar dimensiones máximas
      if (img.width > MAX_IMAGE_DIMENSIONS.width || img.height > MAX_IMAGE_DIMENSIONS.height) {
        resolve({ 
          valid: false, 
          error: `Image dimensions too large. Maximum ${MAX_IMAGE_DIMENSIONS.width}x${MAX_IMAGE_DIMENSIONS.height}px` 
        })
        return
      }
      
      // Verificar dimensiones mínimas
      if (img.width < 1 || img.height < 1) {
        resolve({ valid: false, error: 'Invalid image dimensions' })
        return
      }
      
      resolve({ valid: true })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ valid: false, error: 'Invalid or corrupted image file' })
    }
    
    img.src = url
  })
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/\.+/g, '.') // Replace multiple dots with single dot
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 100) // Limit length
}

/**
 * Generate secure filename
 */
export function generateSecureFilename(originalName: string, userId: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  
  // Sanitize userId to remove special characters
  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, '_')
  
  return `${sanitizedUserId}_${timestamp}_${randomString}.${extension}`
}
