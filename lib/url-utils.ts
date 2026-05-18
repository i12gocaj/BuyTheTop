/**
 * Utilidades para manejo de URLs dinámicas
 */

/**
 * Obtiene la URL base de la aplicación de forma dinámica
 * Funciona tanto en server-side como client-side
 */
export function getBaseUrl(): string {
  // En producción, usar la variable de entorno
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // En desarrollo del lado del servidor (SSR)
  if (typeof window === 'undefined') {
    // Si tenemos el puerto en las variables de entorno
    if (process.env.PORT) {
      return `http://localhost:${process.env.PORT}`
    }
    // Fallback para desarrollo
    return 'http://localhost:3000'
  }

  // En el cliente (browser) - en desarrollo
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    return `${window.location.protocol}//${window.location.host}`
  }

  // En producción del lado del cliente, usar la URL configurada
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Fallback final
  return 'http://localhost:3000'
}

/**
 * Obtiene la URL base para requests del servidor (durante SSR/API calls)
 * Incluye detección automática del puerto desde headers
 */
export function getServerBaseUrl(request?: Request): string {
  // Si tenemos la variable de entorno, úsala
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Si tenemos el request, intentar extraer del host header
  if (request) {
    const host = request.headers.get('host')
    if (host) {
      const protocol = request.headers.get('x-forwarded-proto') || 'http'
      return `${protocol}://${host}`
    }
  }

  // Si tenemos PORT en env
  if (process.env.PORT) {
    return `http://localhost:${process.env.PORT}`
  }

  // Fallback
  return 'http://localhost:3000'
}

/**
 * Obtiene los orígenes permitidos para CORS de forma dinámica
 */
export function getAllowedOrigins(): string[] {
  const baseOrigins = [
    'https://your-domain.com',
    'https://www.your-domain.com'
  ]

  // En desarrollo, agregar puertos comunes
  if (process.env.NODE_ENV === 'development') {
    const devOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:4000',
      'http://localhost:5000',
      'http://localhost:8000',
      'http://localhost:8080'
    ]
    return [...baseOrigins, ...devOrigins]
  }

  return baseOrigins
}
