import { NextRequest, NextResponse } from 'next/server'
import { 
  containsProhibitedWords, 
  validateUsername, 
  validateDisplayName, 
  validateBio,
  logContentFilter
} from './content-filter'

/**
 * Middleware para validar contenido en requests de API
 */
export async function validateContentMiddleware(
  request: NextRequest,
  fields: {
    username?: string
    display_name?: string
    bio?: string
  },
  userId?: string
): Promise<NextResponse | null> {
  const errors: string[] = []
  const warnings: string[] = []

  // Validar username si está presente
  if (fields.username) {
    const validation = validateUsername(fields.username)
    if (!validation.isValid) {
      errors.push(validation.error || 'Invalid username')
      if (userId) {
        logContentFilter(userId, 'username', fields.username, containsProhibitedWords(fields.username))
      }
    }
  }

  // Validar display_name si está presente
  if (fields.display_name) {
    const validation = validateDisplayName(fields.display_name)
    if (!validation.isValid) {
      errors.push(validation.error || 'Invalid display name')
      if (userId) {
        logContentFilter(userId, 'display_name', fields.display_name, containsProhibitedWords(fields.display_name))
      }
    }
  }

  // Validar bio si está presente
  if (fields.bio) {
    const validation = validateBio(fields.bio)
    if (!validation.isValid) {
      if (validation.error?.includes('severely prohibited')) {
        errors.push(validation.error)
      } else {
        warnings.push(validation.error || 'Bio may contain inappropriate content')
      }
      if (userId) {
        logContentFilter(userId, 'bio', fields.bio, containsProhibitedWords(fields.bio))
      }
    }
  }

  // Si hay errores críticos, rechazar la request
  if (errors.length > 0) {
    return NextResponse.json(
      {
        error: 'Content validation failed',
        details: errors,
        code: 'CONTENT_PROHIBITED'
      },
      { status: 400 }
    )
  }

  // Si solo hay advertencias, continuar pero notificar
  if (warnings.length > 0) {
    console.warn('Content warnings:', warnings)
  }

  return null // No hay errores, continuar
}

/**
 * Validación específica para formularios de registro
 */
export async function validateRegistrationContent(
  username: string,
  displayName: string
): Promise<{ isValid: boolean; errors: string[]; suggestions: string[] }> {
  const errors: string[] = []
  const suggestions: string[] = []

  // Validar username para registro
  const usernameValidation = validateUsername(username)
  if (!usernameValidation.isValid) {
    errors.push(usernameValidation.error || 'Invalid username')
    if (usernameValidation.suggestion) {
      suggestions.push(usernameValidation.suggestion)
    }
  }

  // Validar display name para registro
  const displayNameValidation = validateDisplayName(displayName)
  if (!displayNameValidation.isValid) {
    errors.push(displayNameValidation.error || 'Invalid display name')
    if (displayNameValidation.suggestion) {
      suggestions.push(displayNameValidation.suggestion)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions
  }
}

/**
 * Sanitización de contenido para mostrar en la UI
 */
export function sanitizeForDisplay(content: string): string {
  if (!content || typeof content !== 'string') return ''
  
  return content
    // Remover caracteres de control
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Normalizar espacios
    .replace(/\s+/g, ' ')
    .trim()
    // Limitar longitud para prevenir overflow
    .substring(0, 1000)
}

/**
 * Función para reportar contenido inapropiado por usuarios
 */
export interface ContentReport {
  reportedBy: string
  targetUserId: string
  contentType: 'username' | 'display_name' | 'bio' | 'other'
  content: string
  reason: 'spam' | 'harassment' | 'inappropriate' | 'illegal' | 'other'
  description?: string
  timestamp: Date
}

export function createContentReport(
  reportedBy: string,
  targetUserId: string,
  contentType: ContentReport['contentType'],
  content: string,
  reason: ContentReport['reason'],
  description?: string
): ContentReport {
  return {
    reportedBy,
    targetUserId,
    contentType,
    content: sanitizeForDisplay(content),
    reason,
    description: description ? sanitizeForDisplay(description) : undefined,
    timestamp: new Date()
  }
}

/**
 * Configuración del filtro de contenido
 */
export const CONTENT_FILTER_CONFIG = {
  // Niveles de restricción
  restrictions: {
    username: 'strict', // Solo palabras completamente bloqueadas
    display_name: 'moderate', // Bloquear + algunas flagged
    bio: 'lenient' // Permitir más flexibilidad, solo bloquear contenido severo
  },
  
  // Configuración de logging
  logging: {
    enabled: true,
    logLevel: 'warn', // 'info' | 'warn' | 'error'
    includeContent: false // Por privacidad, no loggear el contenido completo
  },
  
  // Configuración de reportes
  reports: {
    enabled: true,
    maxReportsPerUser: 10, // Máximo reportes por usuario por día
    autoModerationThreshold: 3 // Número de reportes para activar moderación automática
  }
}

/**
 * Hook para validar contenido en tiempo real (frontend)
 */
export function useContentValidation() {
  const validateContent = (
    content: string,
    type: 'username' | 'display_name' | 'bio'
  ) => {
    switch (type) {
      case 'username':
        return validateUsername(content)
      case 'display_name':
        return validateDisplayName(content)
      case 'bio':
        return validateBio(content)
      default:
        return { isValid: false, error: 'Invalid content type' }
    }
  }

  const getContentSuggestions = (
    content: string,
    type: 'username' | 'display_name' | 'bio'
  ): string[] => {
    const validation = validateContent(content, type)
    const suggestions: string[] = []

    if (!validation.isValid && validation.suggestion) {
      suggestions.push(validation.suggestion)
    }

    // Sugerencias adicionales según el tipo
    switch (type) {
      case 'username':
        suggestions.push('Try using letters, numbers, hyphens, and underscores only')
        suggestions.push('Avoid using personal information or offensive words')
        break
      case 'display_name':
        suggestions.push('Use a friendly name that represents you appropriately')
        suggestions.push('Avoid controversial or offensive terms')
        break
      case 'bio':
        suggestions.push('Keep your bio positive and appropriate for all audiences')
        suggestions.push('Focus on your interests, hobbies, or professional background')
        break
    }

    return suggestions
  }

  return {
    validateContent,
    getContentSuggestions
  }
}
