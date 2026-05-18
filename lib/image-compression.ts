// Configuración de compresión
const MAX_COMPRESSED_SIZE = 500 * 1024 // 500KB en bytes
const MAX_INPUT_SIZE = 5 * 1024 * 1024 // 5MB en bytes - máximo tamaño de entrada
const WEBP_QUALITY_START = 80 // Calidad inicial
const WEBP_QUALITY_MIN = 20 // Calidad mínima
const MAX_DIMENSION = 1024 // Dimensión máxima (ancho o alto)

export interface CompressionResult {
  buffer: Buffer
  size: number
  width: number
  height: number
  format: 'webp'
  quality: number
}

// Detectar si estamos en el servidor o cliente
const isServer = typeof window === 'undefined'

/**
 * Implementación base para cliente usando Canvas API (solo para web)
 */
async function compressImageInBrowser(
  inputBuffer: Buffer,
  targetSize: number = MAX_COMPRESSED_SIZE
): Promise<CompressionResult> {
  if (isServer) {
    throw new Error('Browser compression not available on server')
  }

  return new Promise((resolve, reject) => {
    const blob = new Blob([new Uint8Array(inputBuffer)])
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    img.onload = () => {
      // Calcular nuevas dimensiones
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      // Función para comprimir con calidad específica
      const tryCompress = (quality: number) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }

          if (blob.size <= targetSize || quality <= WEBP_QUALITY_MIN) {
            // Convertir blob a buffer
            blob.arrayBuffer().then(arrayBuffer => {
              resolve({
                buffer: Buffer.from(arrayBuffer),
                size: blob.size,
                width,
                height,
                format: 'webp',
                quality
              })
            })
          } else {
            // Reducir calidad y reintentar
            tryCompress(quality - 10)
          }
        }, 'image/webp', quality / 100)
      }

      tryCompress(WEBP_QUALITY_START)
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(blob)
  })
}

/**
 * Implementación simple para servidor (sin compresión avanzada)
 */
async function handleImageOnServer(
  inputBuffer: Buffer,
  targetSize: number = MAX_COMPRESSED_SIZE
): Promise<CompressionResult> {
  // Primero validar que el input no exceda el máximo permitido
  if (inputBuffer.length > MAX_INPUT_SIZE) {
    throw new Error(
      `Image file too large (${Math.round(inputBuffer.length / 1024 / 1024)}MB). ` +
      `Maximum allowed: ${Math.round(MAX_INPUT_SIZE / 1024 / 1024)}MB`
    )
  }

  // En el servidor, simplemente validamos y devolvemos metadatos básicos
  // La compresión real se debe hacer en el cliente o en CI/CD
  const info = await getImageInfo(inputBuffer)
  
  // Si la imagen ya es pequeña, devolverla tal como está
  if (inputBuffer.length <= targetSize) {
    return {
      buffer: inputBuffer,
      size: inputBuffer.length,
      width: info.width,
      height: info.height,
      format: 'webp', // Asumimos conversión en cliente
      quality: WEBP_QUALITY_START
    }
  }

  // Si es muy grande pero dentro del límite de input, sugerir compresión en cliente
  throw new Error(
    `Image needs compression (${Math.round(inputBuffer.length / 1024)}KB input). ` +
    `Please compress on client-side before uploading. Target size: ${Math.round(targetSize / 1024)}KB. ` +
    `Consider reducing quality or dimensions.`
  )
}

/**
 * Comprime una imagen a formato WebP con un tamaño máximo de 500KB
 * En el servidor, valida el tamaño y delega la compresión al cliente
 * En el cliente, realiza la compresión usando Canvas API
 */
export async function compressImageToWebP(
  inputBuffer: Buffer,
  targetSize: number = MAX_COMPRESSED_SIZE
): Promise<CompressionResult> {
  try {
    if (isServer) {
      return await handleImageOnServer(inputBuffer, targetSize)
    } else {
      return await compressImageInBrowser(inputBuffer, targetSize)
    }
  } catch (error) {
    console.error('Image compression error:', error)
    throw new Error(`Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Valida si un buffer es una imagen válida
 */
export async function validateImageBuffer(buffer: Buffer): Promise<boolean> {
  try {
    // Verificación básica de headers de imagen
    if (buffer.length < 8) return false
    
    const header = buffer.subarray(0, 8)
    
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      return true
    }
    
    // JPEG: FF D8
    if (header[0] === 0xFF && header[1] === 0xD8) {
      return true
    }
    
    // WebP: RIFF...WEBP
    if (header.toString('ascii', 0, 4) === 'RIFF' && 
        buffer.length >= 12 && 
        buffer.toString('ascii', 8, 12) === 'WEBP') {
      return true
    }
    
    // GIF: GIF8
    if (header.toString('ascii', 0, 4) === 'GIF8') {
      return true
    }
    
    return false
  } catch {
    return false
  }
}

/**
 * Obtiene información básica de una imagen basándose en sus headers
 */
export async function getImageInfo(buffer: Buffer): Promise<{
  width: number
  height: number
  format: string
  size: number
}> {
  try {
    if (!await validateImageBuffer(buffer)) {
      throw new Error('Invalid image format')
    }

    let width = 0
    let height = 0
    let format = 'unknown'

    const header = buffer.subarray(0, 30) // Leer suficientes bytes para metadatos básicos

    // PNG
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      format = 'png'
      if (buffer.length >= 24) {
        width = buffer.readUInt32BE(16)
        height = buffer.readUInt32BE(20)
      }
    }
    
    // JPEG - búsqueda de marcador SOF
    else if (header[0] === 0xFF && header[1] === 0xD8) {
      format = 'jpeg'
      let pos = 2
      while (pos < buffer.length - 8) {
        if (buffer[pos] === 0xFF) {
          const marker = buffer[pos + 1]
          // SOF0, SOF1, SOF2
          if (marker >= 0xC0 && marker <= 0xC2) {
            height = buffer.readUInt16BE(pos + 5)
            width = buffer.readUInt16BE(pos + 7)
            break
          }
          // Saltar este segmento
          if (marker >= 0xE0 && marker <= 0xEF) {
            const segmentLength = buffer.readUInt16BE(pos + 2)
            pos += segmentLength + 2
          } else {
            pos += 2
          }
        } else {
          pos++
        }
      }
    }
    
    // WebP
    else if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      format = 'webp'
      if (buffer.length >= 30) {
        const chunkType = buffer.toString('ascii', 12, 16)
        if (chunkType === 'VP8 ') {
          // VP8 simple
          width = buffer.readUInt16LE(26) & 0x3FFF
          height = buffer.readUInt16LE(28) & 0x3FFF
        } else if (chunkType === 'VP8L') {
          // VP8 Lossless
          const bits = buffer.readUInt32LE(21)
          width = (bits & 0x3FFF) + 1
          height = ((bits >> 14) & 0x3FFF) + 1
        }
      }
    }
    
    // GIF
    else if (buffer.toString('ascii', 0, 4) === 'GIF8') {
      format = 'gif'
      if (buffer.length >= 10) {
        width = buffer.readUInt16LE(6)
        height = buffer.readUInt16LE(8)
      }
    }

    if (width === 0 || height === 0) {
      // Fallback: dimensiones por defecto para imágenes válidas pero no parseables
      width = 100
      height = 100
    }

    return {
      width,
      height,
      format,
      size: buffer.length
    }
  } catch (error) {
    throw new Error('Failed to read image metadata')
  }
}

/**
 * Función auxiliar para comprimir imagen en el cliente
 * Esta funcionalidad se puede usar en componentes de React para pre-comprimir imágenes
 */
export function createClientCompressor() {
  if (isServer) {
    throw new Error('Client compressor not available on server')
  }

  return {
    async compressFile(file: File, targetSize: number = MAX_COMPRESSED_SIZE): Promise<Blob> {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const result = await compressImageToWebP(buffer, targetSize)
      return new Blob([new Uint8Array(result.buffer)], { type: 'image/webp' })
    }
  }
}
