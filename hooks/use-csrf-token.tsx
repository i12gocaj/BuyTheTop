"use client"

import { useState, useEffect, useCallback } from 'react'

interface CSRFTokenState {
  token: string | null
  loading: boolean
  error: string | null
}

/**
 * Hook para manejar tokens CSRF
 */
export function useCSRFToken() {
  const [state, setState] = useState<CSRFTokenState>({
    token: null,
    loading: true,
    error: null
  })

  // Función para obtener un nuevo token
  const fetchToken = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include' // Include cookies
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`)
      }
      
      const data = await response.json()
      
      setState({
        token: data.csrfToken,
        loading: false,
        error: null
      })
    } catch (error) {
      setState({
        token: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch CSRF token'
      })
    }
  }, [])

  // Función para refrescar el token
  const refreshToken = useCallback(() => {
    fetchToken()
  }, [fetchToken])

  // Cargar token inicial
  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  // Función para hacer peticiones con CSRF token
  const fetchWithCSRF = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    if (!state.token) {
      throw new Error('No CSRF token available')
    }

    const headers = new Headers(options.headers)
    headers.set('X-CSRF-Token', state.token)
    
    // Para peticiones JSON, también incluir en el body
    if (options.body && headers.get('content-type')?.includes('application/json')) {
      try {
        const bodyObj = JSON.parse(options.body as string)
        bodyObj.csrfToken = state.token
        options.body = JSON.stringify(bodyObj)
      } catch {
        // Si no se puede parsear como JSON, mantener el body original
      }
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    })
  }, [state.token])

  // Función para hacer peticiones POST con CSRF
  const postWithCSRF = useCallback(async (
    url: string,
    data: any,
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers = new Headers(options.headers)
    headers.set('Content-Type', 'application/json')
    
    return fetchWithCSRF(url, {
      ...options,
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, csrfToken: state.token })
    })
  }, [fetchWithCSRF, state.token])

  // Función para enviar FormData con CSRF
  const postFormWithCSRF = useCallback(async (
    url: string,
    formData: FormData,
    options: RequestInit = {}
  ): Promise<Response> => {
    if (!state.token) {
      throw new Error('No CSRF token available')
    }

    // Agregar token al FormData
    formData.append('csrf-token', state.token)
    
    const headers = new Headers(options.headers)
    headers.set('X-CSRF-Token', state.token)

    return fetch(url, {
      ...options,
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include'
    })
  }, [state.token])

  return {
    ...state,
    refreshToken,
    fetchWithCSRF,
    postWithCSRF,
    postFormWithCSRF
  }
}

/**
 * Componente que provee el token CSRF a sus hijos
 */
export function CSRFTokenProvider({ children }: { children: React.ReactNode }) {
  const { token, loading, error, refreshToken } = useCSRFToken()

  // En caso de error, intentar refrescar
  useEffect(() => {
    if (error) {
      const timer = setTimeout(refreshToken, 5000) // Retry after 5 seconds
      return () => clearTimeout(timer)
    }
  }, [error, refreshToken])

  if (loading) {
    return <div className="flex items-center justify-center p-4">Loading security token...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-red-600">
        <p>Security token error: {error}</p>
        <button 
          onClick={refreshToken}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    )
  }

  return <>{children}</>
}
