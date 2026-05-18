/**
 * Utilidades para compresión de imágenes en el cliente
 */

// Configuración
const MAX_COMPRESSED_SIZE = 500 * 1024 // 500KB
const MAX_DIMENSION = 800 // Dimensión máxima reducida para ser más agresivo
const WEBP_QUALITY_START = 0.7 // Calidad inicial más baja
const WEBP_QUALITY_MIN = 0.05 // Calidad mínima muy agresiva (5%)
const WEBP_QUALITY_STEP = 0.1 // Paso de reducción de calidad

export interface ClientCompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: string
  width: number
  height: number
}

/**
 * Comprime una imagen en el cliente usando Canvas API
 */
export async function compressImageInClient(
  file: File,
  targetSize: number = MAX_COMPRESSED_SIZE
): Promise<ClientCompressionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    img.onload = () => {
      // Calcular dimensiones - ser MUCHO más agresivo para archivos grandes
      let scale = 1
      let targetWidth = img.width
      let targetHeight = img.height
      
      // Escala agresiva basada en el tamaño del archivo
      if (file.size > 4 * 1024 * 1024) {
        // Archivos >4MB: reducir a máximo 600px y escala 0.4
        scale = Math.min(0.4, 600 / Math.max(img.width, img.height))
      } else if (file.size > 2 * 1024 * 1024) {
        // Archivos >2MB: reducir a máximo 700px y escala 0.5
        scale = Math.min(0.5, 700 / Math.max(img.width, img.height))
      } else if (file.size > 1 * 1024 * 1024) {
        // Archivos >1MB: reducir a máximo 800px y escala 0.7
        scale = Math.min(0.7, MAX_DIMENSION / Math.max(img.width, img.height))
      } else {
        // Archivos pequeños: normal
        scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
      }
      
      const width = Math.round(targetWidth * scale)
      const height = Math.round(targetHeight * scale)

      console.log(`� [Client] Scaling: ${img.width}x${img.height} → ${width}x${height} (scale: ${scale.toFixed(2)})`)

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      console.log(`🎨 [Client] Canvas drawn: ${width}x${height}`)

      // Función ULTRA agresiva para comprimir con múltiples estrategias
      let attemptCount = 0
      const maxAttempts = 25 // Más intentos
      
      const tryCompress = (quality: number, dimensionScale = 1) => {
        attemptCount++
        
        // Reducir dimensiones más temprano y más agresivamente
        if (attemptCount > 5 && dimensionScale > 0.3) {
          const newScale = dimensionScale * 0.7 // Reducir más agresivamente
          const newWidth = Math.round(width * newScale)
          const newHeight = Math.round(height * newScale)
          
          canvas.width = newWidth
          canvas.height = newHeight
          ctx.clearRect(0, 0, newWidth, newHeight)
          ctx.drawImage(img, 0, 0, newWidth, newHeight)
          
          tryCompress(quality, newScale)
          return
        }
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            if (blob.size <= targetSize || quality <= WEBP_QUALITY_MIN || attemptCount >= maxAttempts) {
              // Crear archivo comprimido con nombre que refleje el formato WebP
              const baseName = file.name.replace(/\.[^/.]+$/, '')
              const compressedFile = new File([blob], `${baseName}.webp`, {
                type: 'image/webp',
                lastModified: Date.now()
              })

              const result = {
                file: compressedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: `${((1 - blob.size / file.size) * 100).toFixed(1)}%`,
                width: canvas.width,
                height: canvas.height
              }
              
              resolve(result)
            } else {
              // Reducir calidad MUCHO más agresivamente para archivos muy grandes
              let qualityStep;
              if (file.size > 4 * 1024 * 1024) {
                qualityStep = 0.25; // Pasos de 25% para archivos >4MB
              } else if (file.size > 3 * 1024 * 1024) {
                qualityStep = 0.2; // Pasos de 20% para archivos >3MB
              } else if (file.size > 2 * 1024 * 1024) {
                qualityStep = 0.15; // Pasos de 15% para archivos >2MB
              } else {
                qualityStep = WEBP_QUALITY_STEP; // Pasos normales para archivos pequeños
              }
              
              tryCompress(Math.max(quality - qualityStep, WEBP_QUALITY_MIN), dimensionScale)
            }
          },
          'image/webp',
          quality
        )
      }

      tryCompress(WEBP_QUALITY_START)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Verifica si una imagen necesita compresión
 */
export function needsCompression(file: File, targetSize: number = MAX_COMPRESSED_SIZE): boolean {
  return file.size > targetSize
}

/**
 * Obtiene información de una imagen sin comprimirla
 */
export async function getImageInfoClient(file: File): Promise<{
  width: number
  height: number
  size: number
  type: string
}> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type
      })
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}
