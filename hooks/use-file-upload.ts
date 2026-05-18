"use client"

import { useState } from 'react'
import { validateImageFile, validateImageDimensions } from '@/lib/image-validation'

interface UploadState {
  uploading: boolean
  deleting: boolean
  progress: number
  error: string | null
  success: boolean
  url: string | null
}

interface UseFileUploadReturn {
  uploadState: UploadState
  uploadFile: (file: File) => Promise<string | null>
  deleteAvatar: () => Promise<boolean>
  resetState: () => void
}

export function useFileUpload(): UseFileUploadReturn {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    deleting: false,
    progress: 0,
    error: null,
    success: false,
    url: null
  })

  const resetState = () => {
    setUploadState({
      uploading: false,
      deleting: false,
      progress: 0,
      error: null,
      success: false,
      url: null
    })
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploadState(prev => ({
        ...prev,
        uploading: true,
        progress: 0,
        error: null,
        success: false
      }))

      // Validaciones del lado cliente
      const fileValidation = validateImageFile(file)
      if (!fileValidation.valid) {
        throw new Error(fileValidation.error || 'Invalid file')
      }

      setUploadState(prev => ({ ...prev, progress: 25 }))

      // Validar dimensiones
      const dimensionValidation = await validateImageDimensions(file)
      if (!dimensionValidation.valid) {
        throw new Error(dimensionValidation.error || 'Image dimensions too large')
      }

      setUploadState(prev => ({ ...prev, progress: 50 }))

      // Preparar FormData
      const formData = new FormData()
      formData.append('file', file)

      setUploadState(prev => ({ ...prev, progress: 75 }))

      // Subir archivo
      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()

      // Mostrar información de compresión si está disponible
      if (result.compressionRatio) {
        console.log('✅ Image compressed successfully:', {
          originalSize: `${(result.originalSize / 1024 / 1024).toFixed(2)}MB`,
          finalSize: `${(result.size / 1024).toFixed(0)}KB`,
          reduction: result.compressionRatio,
          dimensions: result.dimensions,
          quality: result.quality
        })
      }

      setUploadState({
        uploading: false,
        deleting: false,
        progress: 100,
        error: null,
        success: true,
        url: result.url
      })

      return result.url

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      setUploadState({
        uploading: false,
        deleting: false,
        progress: 0,
        error: errorMessage,
        success: false,
        url: null
      })

      return null
    }
  }

  const deleteAvatar = async (): Promise<boolean> => {
    try {
      setUploadState(prev => ({
        ...prev,
        deleting: true,
        uploading: false,
        error: null
      }))

      const response = await fetch('/api/upload-avatar', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Delete failed')
      }

      setUploadState({
        uploading: false,
        deleting: false,
        progress: 0,
        error: null,
        success: true,
        url: null
      })

      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed'
      
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        deleting: false,
        error: errorMessage
      }))

      return false
    }
  }

  return {
    uploadState,
    uploadFile,
    deleteAvatar,
    resetState
  }
}
