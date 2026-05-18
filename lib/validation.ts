import { z } from 'zod'
import { 
  validateUsername, 
  validateDisplayName, 
  validateBio,
  logContentFilter
} from './content-filter'

// Payment validation schemas
export const PaymentIntentSchema = z.object({
  amount: z.number()
    .min(1, 'Amount must be at least 1,00 €')
    .refine((val) => Number.isInteger(val * 100), 'Amount can have at most 2 decimal places')
})

// Profile validation schemas with enhanced security
export const ProfileUpdateSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
    .refine((val) => {
      const validation = validateUsername(val)
      return validation.isValid
    }, 'Username contains prohibited content')
    .optional(),
  display_name: z.string()
    .min(1, 'Display name is required')
    .max(25, 'Display name cannot exceed 25 characters')
    .regex(/^[\p{L}\p{N}\p{Emoji}\p{Emoji_Component}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}\s\-_.,!?áéíóúÁÉÍÓÚñÑüÜ]+$/u, 'Display name can only contain letters, numbers, spaces, emojis, and basic punctuation')
    .transform((val) => sanitizeHtml(val.trim()))
    .refine((val) => val.length > 0, 'Display name cannot be empty')
    .refine((val) => {
      const validation = validateDisplayName(val)
      return validation.isValid
    }, 'Display name contains prohibited content')
    .optional(),
  bio: z.string()
    .max(100, 'Bio cannot exceed 100 characters')
    .transform((val) => sanitizeHtml(val.trim()))
    .refine((val) => {
      // Check for potentially malicious content
      const suspiciousPatterns = [
        /javascript:/i,
        /data:text\/html/i,
        /vbscript:/i,
        /<script/i,
        /on\w+\s*=/i
      ]
      return !suspiciousPatterns.some(pattern => pattern.test(val))
    }, 'Bio contains potentially dangerous content')
    .refine((val) => {
      // Allow maximum 1 URL in bio - improved detection
      const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi
      const urlMatches = val.match(urlPattern)
      return !urlMatches || urlMatches.length <= 1
    }, 'Bio can contain at most 1 URL')
    .refine((val) => {
      const validation = validateBio(val)
      return validation.isValid
    }, 'Bio contains prohibited content')
    .optional(),
  avatar_url: z.string()
    .url('Must be a valid URL')
    .refine((url) => {
      // Only allow trusted domains for avatars
      const trustedDomains = [
        'supabase.co',
        'githubusercontent.com',
        'gravatar.com',
        'placeholder.com'
      ]
      try {
        const urlObj = new URL(url)
        return trustedDomains.some(domain => urlObj.hostname.includes(domain))
      } catch {
        return false
      }
    }, 'Avatar URL must be from a trusted domain')
    .optional()
    .or(z.literal('')),
  position_notifications_enabled: z.boolean()
    .optional()
    .default(true)
})

// Email change validation schema
export const EmailChangeSchema = z.object({
  new_email: z.string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .refine((email) => {
      // Validate email domain more thoroughly
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }, 'Please enter a valid email address with a proper domain')
    .refine((email) => {
      // Check for common invalid domains - but allow demo for testing
      const invalidDomains = ['.test', '.local', '.invalid']
      return !invalidDomains.some(domain => email.toLowerCase().includes(domain))
    }, 'Please use a real email address')
    .transform((val) => val.toLowerCase().trim())
})

// Search and pagination schemas
export const SearchSchema = z.object({
  search: z.string()
    .max(100, 'Search term too long')
    .regex(/^[a-zA-Z0-9\s\-_@.]*$/, 'Search contains invalid characters')
    .optional(),
  page: z.coerce.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(1000, 'Page number too high')
    .default(1),
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10)
})

// Admin operations schemas
export const AdminActionSchema = z.object({
  action: z.enum(['fix_positions', 'audit_history', 'debug_positions'], {
    errorMap: () => ({ message: 'Invalid admin action' })
  }),
  confirm: z.boolean().refine(val => val === true, 'Action must be confirmed')
})

// Auth schemas
export const SignInSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password is too long')
})

export const SignUpSchema = SignInSchema.extend({
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Utility function to sanitize HTML content with enhanced security
export function sanitizeHtml(content: string): string {
  if (!content || typeof content !== 'string') return ''
  
  return content
    // Remove script tags and their content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    // Remove iframe tags and their content
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    // Remove object and embed tags
    .replace(/<(object|embed)[^>]*>.*?<\/\1>/gi, '')
    // Remove ALL HTML tags for extra security
    .replace(/<[^>]*>/g, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
    // Remove javascript: and vbscript: protocols
    .replace(/(javascript|vbscript|data):/gi, '')
    // Remove style attributes that could contain expressions
    .replace(/style\s*=\s*["'][^"']*["']/gi, '')
    // Remove dangerous HTML entities
    .replace(/&lt;script/gi, '')
    .replace(/&amp;lt;script/gi, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim()
    // Limit length as additional safety
    .substring(0, 1000)
}

// Additional validation utilities
export function isValidDisplayName(name: string): boolean {
  if (!name || name.length < 1 || name.length > 25) return false
  
  // Check if it matches the allowed characters (including emojis)
  const validCharactersRegex = /^[\p{L}\p{N}\p{Emoji}\p{Emoji_Component}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}\s\-_.,!?áéíóúÁÉÍÓÚñÑüÜ]+$/u
  if (!validCharactersRegex.test(name)) return false
  
  // Use the new content filter system
  const validation = validateDisplayName(name)
  if (!validation.isValid) return false
  
  // Check for suspicious patterns - SOLO los más críticos para XSS/inyecciones
  const suspiciousPatterns = [
    /<script[^>]*>/i, // Script tags específicos (no toda etiqueta HTML)
    /javascript:/i, // JavaScript injection
    /data:text\/html/i, // Data URLs HTML
    /vbscript:/i, // VBScript injection
    /on\w+\s*=/i, // Event handlers (onclick, onload, etc)
    /^(null|undefined|admin|system|root)$/i, // Palabras reservadas exactas
  ]
  
  return !suspiciousPatterns.some(pattern => pattern.test(name))
}

export function isValidBio(bio: string): boolean {
  if (!bio) return true // Bio is optional
  if (bio.length > 100) return false
  
  // Use the new content filter system
  const validation = validateBio(bio)
  if (!validation.isValid && validation.error?.includes('severely prohibited')) {
    return false
  }
  
  // Check for URL-like patterns that might be suspicious - improved detection
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi
  const urlMatches = bio.match(urlPattern)
  
  // Allow max 1 URL in bio
  return !urlMatches || urlMatches.length <= 1
}

// Función de utilidad para validar contenido con logging
export function validateContentWithLogging(
  userId: string,
  contentType: 'username' | 'display_name' | 'bio',
  content: string
): { isValid: boolean; error?: string; suggestion?: string } {
  let validation: { isValid: boolean; error?: string; suggestion?: string }
  
  switch (contentType) {
    case 'username':
      validation = validateUsername(content)
      break
    case 'display_name':
      validation = validateDisplayName(content)
      break
    case 'bio':
      validation = validateBio(content)
      break
    default:
      validation = { isValid: false, error: 'Invalid content type' }
  }
  
  // Log si hay problemas de contenido
  if (!validation.isValid) {
    logContentFilter(userId, contentType, content, {
      isBlocked: true,
      isFlagged: false,
      blockedWords: [],
      flaggedWords: [],
      severity: 'medium'
    })
  }
  
  return validation
}
