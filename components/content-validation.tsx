'use client'

import React, { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { 
  validateUsername, 
  validateDisplayName, 
  validateBio,
  containsProhibitedWords
} from '@/lib/content-filter'

interface ContentValidationProps {
  content: string
  contentType: 'username' | 'display_name' | 'bio'
  onChange?: (isValid: boolean, suggestions?: string[]) => void
  showSuggestions?: boolean
  className?: string
}

export function ContentValidation({
  content,
  contentType,
  onChange,
  showSuggestions = true,
  className = ''
}: ContentValidationProps) {
  const [validation, setValidation] = useState<{
    isValid: boolean
    error?: string
    suggestion?: string
    severity?: 'none' | 'low' | 'medium' | 'high'
  }>({ isValid: true })

  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const validateContent = () => {
      let result: { isValid: boolean; error?: string; suggestion?: string }
      
      switch (contentType) {
        case 'username':
          result = validateUsername(content)
          break
        case 'display_name':
          result = validateDisplayName(content)
          break
        case 'bio':
          result = validateBio(content)
          break
        default:
          result = { isValid: true }
      }

      // Obtener información adicional sobre la severidad
      const contentAnalysis = containsProhibitedWords(content)
      
      setValidation({
        ...result,
        severity: contentAnalysis.severity
      })

      // Notificar cambios al componente padre
      if (onChange) {
        const suggestions = []
        if (result.suggestion) suggestions.push(result.suggestion)
        onChange(result.isValid, suggestions)
      }

      // Reset dismissed state when content changes
      setDismissed(false)
    }

    if (content) {
      validateContent()
    } else {
      setValidation({ isValid: true })
      if (onChange) onChange(true, [])
    }
  }, [content, contentType, onChange])

  if (!content || validation.isValid || dismissed) {
    return null
  }

  const getAlertVariant = () => {
    switch (validation.severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'destructive'
      case 'low':
        return 'default'
      default:
        return 'default'
    }
  }

  const getAlertStyles = () => {
    switch (validation.severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200'
      case 'medium':
        return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/50 dark:border-orange-800 dark:text-orange-200'
      case 'low':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/50 dark:border-yellow-800 dark:text-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-200'
    }
  }

  const getIcon = () => {
    switch (validation.severity) {
      case 'high':
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />
      case 'low':
        return <Info className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getSeverityBadge = () => {
    if (!validation.severity || validation.severity === 'none') return null

    const severityConfig = {
      low: { 
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700',
        text: 'LOW',
        icon: '⚠️'
      },
      medium: { 
        color: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700',
        text: 'MEDIUM',
        icon: '🚨'
      },
      high: { 
        color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700',
        text: 'HIGH',
        icon: '🚫'
      }
    }

    const config = severityConfig[validation.severity]

    return (
      <Badge 
        variant="outline" 
        className={`ml-2 text-xs font-semibold px-2 py-1 ${config.color} shadow-sm`}
      >
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </Badge>
    )
  }

  return (
    <div className={`mt-3 rounded-lg border-l-4 p-4 shadow-sm ${getAlertStyles()} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <p className="text-sm font-medium leading-5">
                {validation.error}
              </p>
              {getSeverityBadge()}
            </div>
            
            {showSuggestions && validation.suggestion && (
              <div className="mt-3 p-3 rounded-md bg-white/50 dark:bg-black/20 border border-current/20">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5 opacity-70" />
                  <div className="text-sm">
                    <span className="font-medium">Suggestion:</span>
                    <p className="mt-1 opacity-90">{validation.suggestion}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="ml-3 h-8 w-8 p-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface ContentFilterStatusProps {
  username?: string
  displayName?: string
  bio?: string
  className?: string
}

export function ContentFilterStatus({
  username,
  displayName,
  bio,
  className = ''
}: ContentFilterStatusProps) {
  const [allValid, setAllValid] = useState(true)
  const [validationResults, setValidationResults] = useState<{
    username: boolean
    displayName: boolean
    bio: boolean
  }>({
    username: true,
    displayName: true,
    bio: true
  })

  useEffect(() => {
    const results = {
      username: username ? validateUsername(username).isValid : true,
      displayName: displayName ? validateDisplayName(displayName).isValid : true,
      bio: bio ? validateBio(bio).isValid : true
    }

    setValidationResults(results)
    setAllValid(Object.values(results).every(Boolean))
  }, [username, displayName, bio])

  if (allValid) {
    return (
      <div className={`flex items-center text-sm text-green-600 ${className}`}>
        <CheckCircle className="h-4 w-4 mr-1" />
        Content validation passed
      </div>
    )
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {!validationResults.username && username && (
        <ContentValidation
          content={username}
          contentType="username"
          showSuggestions={false}
          className="text-xs"
        />
      )}
      {!validationResults.displayName && displayName && (
        <ContentValidation
          content={displayName}
          contentType="display_name"
          showSuggestions={false}
          className="text-xs"
        />
      )}
      {!validationResults.bio && bio && (
        <ContentValidation
          content={bio}
          contentType="bio"
          showSuggestions={false}
          className="text-xs"
        />
      )}
    </div>
  )
}

// Hook personalizado para usar en formularios
export function useContentFilter(
  contentType: 'username' | 'display_name' | 'bio'
) {
  const [isValid, setIsValid] = useState(true)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const validateContent = (content: string) => {
    let result: { isValid: boolean; error?: string; suggestion?: string }
    
    switch (contentType) {
      case 'username':
        result = validateUsername(content)
        break
      case 'display_name':
        result = validateDisplayName(content)
        break
      case 'bio':
        result = validateBio(content)
        break
      default:
        result = { isValid: true }
    }

    setIsValid(result.isValid)
    setError(result.error || null)
    setSuggestions(result.suggestion ? [result.suggestion] : [])

    return result
  }

  const getContentSuggestions = (content: string): string[] => {
    const validation = validateContent(content)
    const suggestions: string[] = []

    if (!validation.isValid && validation.suggestion) {
      suggestions.push(validation.suggestion)
    }

    // Sugerencias adicionales según el tipo
    switch (contentType) {
      case 'username':
        suggestions.push('Use only letters, numbers, hyphens and underscores')
        suggestions.push('Avoid personal information or offensive words')
        break
      case 'display_name':
        suggestions.push('Use a friendly name that represents you appropriately')
        suggestions.push('Avoid controversial or offensive terms')
        break
      case 'bio':
        suggestions.push('Keep your bio positive and appropriate for all audiences')
        suggestions.push('Focus on your interests, hobbies or professional background')
        break
    }

    return suggestions
  }

  return {
    isValid,
    error,
    suggestions,
    validateContent,
    getContentSuggestions
  }
}
