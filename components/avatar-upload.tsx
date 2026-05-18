"use client"

import React, { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, Trash2, CheckCircle, AlertCircle } from "lucide-react"
import { useFileUpload } from "@/hooks/use-file-upload"
import { validateImageFile } from "@/lib/image-validation"
import { compressImageInClient, needsCompression } from "@/lib/client-image-compression"

// Componente de progreso simple
const SimpleProgress = ({ value }: { value: number }) => (
  <div className="w-full bg-[#333] rounded-full h-2">
    <div 
      className="bg-[#c9a96e] h-2 rounded-full transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
)

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userDisplayName?: string
  userEmail?: string
  onAvatarChange?: (url: string | null) => void
  className?: string
}

export default function AvatarUpload({
  currentAvatarUrl,
  userDisplayName,
  userEmail,
  onAvatarChange,
  className = ""
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { uploadState, uploadFile, deleteAvatar, resetState } = useFileUpload()

    // Manejar cambio en input de archivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Manejar selección de archivo
  const handleFileSelect = async (file: File) => {
    if (!file) {
      return
    }

    // Validar archivo inmediatamente
    const validation = validateImageFile(file)
    if (!validation.valid) {
      alert(validation.error || 'Invalid file')
      clearSelection()
      return
    }

    setIsCompressing(true)
    setCompressionInfo(null)
    resetState() // Limpiar estados previos

    try {
      let finalFile = file
      let compressionText = null

      // Verificar si necesita compresión
      if (needsCompression(file)) {
        const compressionResult = await compressImageInClient(file)
        finalFile = compressionResult.file
        
        compressionText = `Compressed: ${(compressionResult.originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressionResult.compressedSize / 1024).toFixed(0)}KB (${compressionResult.compressionRatio} reduction)`
      } else {
        compressionText = `No compression needed: ${(file.size / 1024).toFixed(0)}KB`
      }

      // Establecer archivo final y preview
      setSelectedFile(finalFile)
      setCompressionInfo(compressionText)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(finalFile)
      
    } catch (error) {
      console.error('Error processing image:', error)
      alert('Error processing image. Please try a different file.')
      clearSelection()
    } finally {
      setIsCompressing(false)
    }
  }

  // Subir archivo seleccionado
  const handleUpload = async () => {
    if (!selectedFile) return

    const uploadedUrl = await uploadFile(selectedFile)
    if (uploadedUrl) {
      onAvatarChange?.(uploadedUrl)
      setSelectedFile(null) // Limpiar archivo seleccionado después del éxito
    }
  }

  // Eliminar avatar actual
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete your avatar?')) {
      const success = await deleteAvatar()
      if (success) {
        setPreview(null)
        onAvatarChange?.(null)
        clearSelection()
      }
    }
  }

  // Limpiar selección
  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(currentAvatarUrl || null)
    setIsCompressing(false)
    setCompressionInfo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    resetState()
  }

  // Abrir selector de archivos
  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  const getInitials = () => {
    return (userDisplayName || userEmail || 'U').charAt(0).toUpperCase()
  }

  const hasChanges = selectedFile !== null && !isCompressing
  const isUploading = uploadState.uploading
  const isDeleting = uploadState.deleting

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Avatar Display */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-[#333]">
            <AvatarImage src={preview || undefined} alt="Profile" />
            <AvatarFallback className="bg-[#333] text-[#c9a96e] text-2xl">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          {/* Badge de archivo seleccionado */}
          {hasChanges && (
            <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1">
              <CheckCircle className="h-3 w-3" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          {/* Controles de archivo */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openFileSelector}
              disabled={isUploading || isDeleting}
              className="text-[#8a8a8a] hover:text-[#c9a96e] hover:bg-[#1a1a1a] border border-[#333] hover:border-[#c9a96e]"
            >
              <Upload className="mr-2 h-4 w-4" />
              {hasChanges ? 'Change' : 'Upload'}
            </Button>

            {hasChanges && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={isUploading || isDeleting}
                className="text-[#c9a96e] hover:text-[#c9a96e] hover:bg-[#2a2a2a] border border-transparent hover:border-[#c9a96e]"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}

            {currentAvatarUrl && !hasChanges && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isUploading || isDeleting}
                className="text-[#8a8a8a] hover:text-red-400 hover:bg-[#1a1a1a]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>

          {/* Botón de subida */}
          {hasChanges && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || isCompressing || isDeleting}
              className="w-full bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] font-medium"
            >
              {isCompressing ? 'Compressing...' : isUploading ? 'Uploading...' : 'Upload Avatar'}
            </Button>
          )}

          {/* Información del archivo */}
          <div className="space-y-1 text-xs text-[#666]">
            <p>JPEG, PNG, GIF, WebP (max 5MB)</p>
            <p>Recommended: 400x400px for best display</p>
            {isCompressing && (
              <p className="text-blue-400">
                🔄 Compressing image...
              </p>
            )}
            {selectedFile && !isCompressing && (
              <p className="text-green-400">
                ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)}KB)
              </p>
            )}
            {compressionInfo && !isCompressing && (
              <p className="text-orange-400 text-xs">
                📦 {compressionInfo}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {(isUploading || isDeleting) && (
        <div className="space-y-2">
          <SimpleProgress value={uploadState.progress} />
          <p className="text-xs text-[#666] text-center">
            {isDeleting ? 'Deleting...' : `Uploading... ${uploadState.progress}%`}
          </p>
        </div>
      )}

      {/* Status messages */}
      {uploadState.error && (
        <Alert className="border-red-700/50 bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">
            {uploadState.error}
          </AlertDescription>
        </Alert>
      )}

      {uploadState.success && !isUploading && !isDeleting && (
        <Alert className="border-green-700/50 bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-400">
            {uploadState.url ? 'Avatar updated successfully!' : 'Avatar deleted successfully!'}
          </AlertDescription>
        </Alert>
      )}

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
