// Logger utility for collecting and managing logs
// This module provides functionality to collect logs in memory for debugging

// Buffer para almacenar logs temporalmente
let logBuffer: string[] = []
const MAX_LOGS = 100

// Función para agregar logs al buffer
export function addLog(message: string) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${message}`
  logBuffer.push(logEntry)
  
  // Mantener solo los últimos MAX_LOGS
  if (logBuffer.length > MAX_LOGS) {
    logBuffer = logBuffer.slice(-MAX_LOGS)
  }
  
  // También enviar a console para Cloudflare
  console.log(logEntry)
}

// Función para obtener todos los logs
export function getLogs(): string[] {
  return [...logBuffer]
}

// Función para limpiar los logs
export function clearLogs(): void {
  logBuffer = []
}

// Función para obtener el conteo de logs
export function getLogCount(): number {
  return logBuffer.length
}
