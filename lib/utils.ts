import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una cantidad monetaria con separadores de miles en formato español
 * @param amount - La cantidad a formatear
 * @param includeSymbol - Si incluir el símbolo € (por defecto true)
 * @param decimals - Número de decimales a mostrar (por defecto 2)
 * @returns Cantidad formateada (ej: "8.967,56 €")
 */
export function formatCurrency(
  amount: number | null | undefined, 
  includeSymbol: boolean = true, 
  decimals: number = 2
): string {
  const safeAmount = amount || 0
  
  const formatted = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true, // Fuerza el uso de separadores de miles
  }).format(safeAmount)
  
  return includeSymbol ? `${formatted} €` : formatted
}
