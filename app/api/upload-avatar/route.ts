export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  ALLOWED_IMAGE_TYPES, 
  MAX_FILE_SIZE, 
  MIN_FILE_SIZE,
  generateSecureFilename, 
  isSecureFilename,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILENAME_LENGTH
} from '@/lib/image-validation'
import { compressImageToWebP, validateImageBuffer } from '@/lib/image-compression'
import { z } from 'zod'
import { checkRateLimitWithUser, getRateLimitHeaders } from '@/lib/rate-limit'
import { logSecurityEvent } from '@/lib/security-logger'

// Configuración de validación
const ENABLE_CONTENT_VALIDATION = false // Temporal: deshabilitar validación de contenido si causa problemas
const ENABLE_SIGNATURE_VALIDATION = true // Opción para deshabilitar validación de firma si es necesario

// Esquema de validación para la subida de archivos
const FileUploadSchema = z.object({
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
      (file) => isSecureFilename(file.name),
      'Invalid filename - contains unsafe characters'
    )
})

/**
 * Valida la firma del archivo para asegurar que es realmente una imagen
 */
async function validateFileSignature(file: File): Promise<boolean> {
  const buffer = Buffer.from(await file.arrayBuffer())
  
  if (buffer.length === 0) return false

  // Firmas de archivo conocidas
  const signatures = {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    gif87: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    gif89: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
    webp: [0x52, 0x49, 0x46, 0x46] // RIFF header
  }

  // Verificar cada tipo de firma conocida
  for (const [format, signature] of Object.entries(signatures)) {
    let matches = true
    for (let i = 0; i < signature.length && i < buffer.length; i++) {
      if (buffer[i] !== signature[i]) {
        matches = false
        break
      }
    }
    
    if (matches) {
      // Para WebP, verificar también que contenga 'WEBP' después de RIFF
      if (format === 'webp') {
        if (buffer.length >= 12) {
          const webpSignature = buffer.subarray(8, 12)
          return webpSignature.toString('ascii') === 'WEBP'
        }
        return false
      }
      return true
    }
  }

  return false
}

/**
 * Validación adicional de seguridad para detectar contenido malicioso
 * Refinada para evitar falsos positivos con archivos de imagen legítimos
 */
async function validateFileContent(file: File): Promise<{ valid: boolean; error?: string }> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Para archivos de imagen, solo verificamos patrones muy específicos y obvios
    // que no deberían aparecer en archivos de imagen binarios legítimos
    
    // Convertir solo los primeros 1KB a texto para verificar metadatos/headers
    const headerContent = buffer.slice(0, 1024).toString('ascii', 0, 1024)
    
    // Patrones que definitivamente NO deberían estar en archivos de imagen
    const definitelyMaliciousPatterns = [
      /^<\?php/i,           // PHP opening tag at the beginning
      /^<%/,                // ASP opening tag at the beginning  
      /^\s*<script/i,       // Script tag at the beginning
      /eval\s*\(/i,         // eval() calls
      /exec\s*\(/i,         // exec() calls
    ]
    
    // Solo verificar estos patrones en el header/metadata de la imagen
    for (const pattern of definitelyMaliciousPatterns) {
      if (pattern.test(headerContent)) {
        return { valid: false, error: 'File contains potentially malicious content' }
      }
    }
    
    // Verificar null bytes solo en las primeras 512 bytes (headers)
    const headerBytes = buffer.slice(0, 512)
    const nullByteCount = headerBytes.filter(byte => byte === 0).length
    
    // Si hay demasiados null bytes en el header, podría ser sospechoso
    // Pero las imágenes pueden tener algunos null bytes legítimos
    if (nullByteCount > headerBytes.length * 0.1) { // Más del 10% null bytes en header
      // Solo rechazar si también hay patrones ASCII sospechosos
      const asciiContent = headerBytes.toString('ascii').replace(/[^\x20-\x7E]/g, '')
      if (asciiContent.length > 20 && /(<|>|script|php|eval)/i.test(asciiContent)) {
        return { valid: false, error: 'File contains potentially malicious content' }
      }
    }
    
    return { valid: true }
  } catch {
    return { valid: false, error: 'Failed to validate file content' }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'localhost'
    
    // First verify authentication to get user ID for enhanced rate limiting
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('🔐 Upload avatar - User result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      error: userError?.message 
    })

    if (userError || !user) {
      logSecurityEvent('auth_failure', request, {
        endpoint: '/api/upload-avatar',
        reason: 'Authentication required for file upload'
      }, 'medium')
      
      console.error('🔐 Upload avatar - Authentication failed:', userError)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Enhanced rate limiting with user-based limits
    const rateLimitResult = checkRateLimitWithUser(clientIP, user.id, 'upload')
    
    if (!rateLimitResult.allowed) {
      logSecurityEvent('rate_limit_exceeded', request, {
        endpoint: '/api/upload-avatar',
        limitedBy: rateLimitResult.limitedBy,
        userId: user.id
      }, 'high')
      
      const response = NextResponse.json(
        { error: `Rate limit exceeded. Limited by ${rateLimitResult.limitedBy}. Try again later.` },
        { status: 429 }
      )
      
      // Add rate limit headers
      const headers = getRateLimitHeaders(
        rateLimitResult.remaining,
        rateLimitResult.resetTime,
        rateLimitResult.limitedBy === 'user' ? 8 : 10 // User limit is more restrictive
      )
      
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    }

    // 2. File validation
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      logSecurityEvent('file_upload_rejected', request, {
        reason: 'No file provided',
        userId: user.id
      }, 'low')
      
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file using schema
    try {
      FileUploadSchema.parse({ file })
    } catch (error) {
      logSecurityEvent('file_upload_rejected', request, {
        reason: 'File validation failed',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId: user.id,
        validationError: error instanceof z.ZodError ? error.errors[0]?.message : 'Unknown'
      }, 'medium')
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0]?.message || 'Invalid file' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'File validation failed' },
        { status: 400 }
      )
    }



    // Validar firma del archivo (opcional)
    if (ENABLE_SIGNATURE_VALIDATION) {
      const isValidSignature = await validateFileSignature(file)
      if (!isValidSignature) {
        console.warn('File signature validation failed for:', {
          name: file.name,
          type: file.type,
          size: file.size,
          firstBytes: Buffer.from(await file.slice(0, 16).arrayBuffer()).toString('hex')
        })
        return NextResponse.json(
          { 
            error: 'File signature doesn\'t match image format',
            details: 'The file content doesn\'t match a valid image format (JPEG, PNG, GIF, WebP)',
            suggestion: 'Please ensure you\'re uploading a valid image file'
          },
          { status: 400 }
        )
      }
    }

    // Validar contenido del archivo (validación refinada)
    if (ENABLE_CONTENT_VALIDATION) {
      const contentValidation = await validateFileContent(file)
      if (!contentValidation.valid) {
        console.warn('Content validation failed for file:', file.name, 'Error:', contentValidation.error)
        return NextResponse.json(
          { error: contentValidation.error || 'Invalid file content' },
          { status: 400 }
        )
      }
    }

    // Convertir archivo a buffer para procesamiento
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    // Validar que el buffer es una imagen válida
    const isValidImage = await validateImageBuffer(fileBuffer)
    if (!isValidImage) {
      return NextResponse.json(
        { error: 'Invalid image file' },
        { status: 400 }
      )
    }

    // Comprimir imagen a WebP con máximo 500KB
    console.log('🔄 Checking image size and format...')
    
    try {
      const compressionResult = await compressImageToWebP(fileBuffer)
      
      console.log('✅ Image processed:', {
        originalSize: file.size,
        finalSize: compressionResult.size,
        dimensions: `${compressionResult.width}x${compressionResult.height}`,
        quality: compressionResult.quality,
        reduction: `${((1 - compressionResult.size / file.size) * 100).toFixed(1)}%`
      })

      // Generar nombre de archivo seguro con extensión .webp
      const originalName = file.name.replace(/\.[^/.]+$/, '') // Remover extensión original
      const secureFilename = generateSecureFilename(originalName + '.webp', user.id)

      const filePath = `${user.id}/${secureFilename}`

      // Subir archivo comprimido a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressionResult.buffer, {
          cacheControl: '3600',
          upsert: false, // No sobrescribir archivos existentes
          contentType: 'image/webp',
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload file' },
          { status: 500 }
        )
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path)

      // Continuar con el resto de la lógica...
      
      // Eliminar avatar anterior si existe
      try {
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()

        if (existingProfile?.avatar_url) {
          // Extraer el path del avatar anterior
          const oldUrl = existingProfile.avatar_url
          if (oldUrl.includes('avatars/')) {
            const oldPath = oldUrl.split('avatars/')[1]
            if (oldPath && oldPath !== uploadData.path) {
              await supabase.storage.from('avatars').remove([oldPath])
            }
          }
        }
      } catch (error) {
        // No fallar si no se puede eliminar el archivo anterior
        console.warn('Could not delete old avatar:', error)
      }

      // Actualizar URL del avatar en el perfil
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (updateError) {
        console.error('Profile update error:', updateError)
        // Intentar eliminar el archivo subido si no se pudo actualizar el perfil
        await supabase.storage.from('avatars').remove([uploadData.path])
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: secureFilename,
        size: compressionResult.size,
        type: 'image/webp',
        originalSize: file.size,
        compressionRatio: `${((1 - compressionResult.size / file.size) * 100).toFixed(1)}%`,
        dimensions: `${compressionResult.width}x${compressionResult.height}`,
        quality: compressionResult.quality
      })
      
    } catch (compressionError) {
      console.error('Image processing error:', compressionError)
      
      // Si el error sugiere compresión en cliente, devolver mensaje específico
      if (compressionError instanceof Error && compressionError.message.includes('compress on client-side')) {
        return NextResponse.json(
          { 
            error: 'Image needs compression',
            details: compressionError.message,
            suggestion: 'The image is larger than 500KB. Please compress it before uploading by reducing quality or dimensions.',
            currentSize: Math.round(file.size / 1024) + 'KB',
            targetSize: '500KB'
          },
          { status: 413 } // Payload Too Large
        )
      }
      
      // Si el archivo es demasiado grande (más de 5MB)
      if (compressionError instanceof Error && compressionError.message.includes('file too large')) {
        return NextResponse.json(
          { 
            error: 'File too large',
            details: compressionError.message,
            suggestion: 'Please choose an image smaller than 5MB.',
            currentSize: Math.round(file.size / 1024 / 1024) + 'MB',
            maxSize: '5MB'
          },
          { status: 413 } // Payload Too Large
        )
      }
      
      // Otros errores de procesamiento
      return NextResponse.json(
        { error: 'Failed to process image' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Endpoint para eliminar avatar
export async function DELETE(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Obtener el perfil actual
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.avatar_url) {
      return NextResponse.json(
        { error: 'No avatar to delete' },
        { status: 404 }
      )
    }

    // Extraer el path del archivo
    const avatarUrl = profile.avatar_url
    if (avatarUrl.includes('avatars/')) {
      const filePath = avatarUrl.split('avatars/')[1]
      
      // Eliminar archivo de Storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath])

      if (deleteError) {
        console.error('File deletion error:', deleteError)
      }
    }

    // Eliminar URL del perfil
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully'
    })

  } catch (error) {
    console.error('Avatar deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
