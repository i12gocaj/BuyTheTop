/**
 * Configuración personalizada del filtro de contenido para BuyTheTop
 * Este archivo permite personalizar las palabras prohibidas específicas para el contexto de la plataforma
 */

// Palabras específicas relacionadas con el contexto de BuyTheTop que deberían ser moderadas
export const PLATFORM_SPECIFIC_WORDS = {
  // Palabras relacionadas con manipulación del ranking
  ranking_manipulation: [
    'cheat', 'trampa', 'hack', 'bot', 'fake', 'falso', 'scam', 'estafa',
    'exploit', 'bug', 'glitch', 'manipulation', 'manipulacion', 'fraud', 'fraude',
    'autoclick', 'macro', 'script', 'automation', 'automatizacion', 'multiple',
    'accounts', 'cuentas', 'smurf', 'alt', 'alternate', 'boost', 'boosting',
    'rank', 'manipulation', 'win', 'trading', 'intercambio', 'account', 'sharing'
  ],

  // Palabras relacionadas con actividades financieras sospechosas
  financial_suspicious: [
    'moneylaundering', 'lavadodinero', 'ponzi', 'pyramid', 'piramidal',
    'investment', 'inversion', 'guaranteed', 'garantizado', 'profit', 'ganancia',
    'roi', 'bitcoin', 'crypto', 'trading', 'forex', 'binary', 'binario',
    'multilevel', 'marketing', 'mlm', 'network', 'red', 'mercadeo',
    'passive', 'income', 'ingresos', 'pasivos', 'easy', 'money', 'dinero', 'facil',
    'get', 'rich', 'quick', 'hacerse', 'rico', 'rapido', 'millionaire', 'millonario'
  ],

  // Palabras que pueden confundir sobre el propósito de la plataforma
  misleading_platform: [
    'casino', 'gambling', 'bet', 'apuesta', 'lottery', 'loteria', 'prize',
    'premio', 'winner', 'ganador', 'jackpot', 'bingo', 'poker', 'slots',
    'roulette', 'ruleta', 'blackjack', 'dice', 'dados', 'scratch', 'rasca',
    'sports', 'betting', 'apuestas', 'deportivas', 'odds', 'cuotas',
    'handicap', 'spread', 'over', 'under', 'parlay', 'accumulator'
  ],

  // Palabras relacionadas con competencia desleal
  unfair_competition: [
    'buyrank', 'paytowin', 'pagarganar', 'bribe', 'soborno', 'corruption',
    'corrupcion', 'insider', 'advantage', 'ventaja', 'rigged', 'manipulado',
    'fixed', 'arreglado', 'predetermined', 'predeterminado', 'scripted',
    'conspiracy', 'conspiracion', 'collusion', 'colusion', 'match', 'fixing'
  ],

  // Palabras relacionadas con contenido sexual/adulto específico
  adult_content: [
    'sexo', 'sex', 'porno', 'porn', 'xxx', 'adult', 'adulto', 'webcam',
    'cam', 'girl', 'boy', 'live', 'show', 'espectaculo', 'strip', 'desnudo',
    'naked', 'nude', 'escort', 'acompañante', 'masaje', 'massage', 'erotico',
    'erotic', 'fetish', 'fetiche', 'bdsm', 'kinky', 'naughty', 'travieso'
  ],

  // Insultos y lenguaje ofensivo en español
  offensive_spanish: [
    'cabrón', 'cabron', 'hijo', 'puta', 'hijoputa', 'gilipollas', 'gilipolla',
    'capullo', 'mamón', 'mamon', 'coño', 'joder', 'mierda', 'cagada',
    'polla', 'verga', 'pendejo', 'culero', 'pinche', 'chingada', 'chingar',
    'maricón', 'maricon', 'puto', 'zorra', 'bollera', 'tortillera'
  ]
}

// Palabras que están permitidas en BuyTheTop pero podrían ser problemáticas en otros contextos
export const PLATFORM_ALLOWED_WORDS = [
  'buy', 'comprar', 'top', 'ranking', 'money', 'dinero', 'payment', 'pago',
  'contribute', 'contribuir', 'donation', 'donacion', 'premium', 'elite',
  'leaderboard', 'clasificacion', 'position', 'posicion', 'climb', 'subir'
]

// Configuración de severidad específica para la plataforma
export const PLATFORM_SEVERITY_CONFIG = {
  // Palabras que requieren acción inmediata (ban inmediato)
  immediate_action: [
    ...PLATFORM_SPECIFIC_WORDS.ranking_manipulation,
    'terrorist', 'terrorism', 'kill', 'murder', 'suicide', 'rape',
    'nazi', 'hitler', 'genocide', 'bomb', 'weapon', 'drug', 'cocaine'
  ],

  // Palabras que requieren revisión manual
  manual_review: [
    ...PLATFORM_SPECIFIC_WORDS.financial_suspicious,
    ...PLATFORM_SPECIFIC_WORDS.misleading_platform,
    'admin', 'moderator', 'system', 'test', 'hack', 'exploit'
  ],

  // Palabras que generan advertencia pero no bloquean
  warning_only: [
    ...PLATFORM_SPECIFIC_WORDS.unfair_competition,
    'scam', 'fake', 'cheat', 'bot'
  ]
}

// Configuración de contexto para diferentes tipos de contenido
export const CONTENT_TYPE_CONFIG = {
  username: {
    // Para usernames, ser más estricto
    blocked_categories: [
      'immediate_action',
      'manual_review',
      'ranking_manipulation',
      'financial_suspicious'
    ],
    max_warnings: 0, // No permitir advertencias en usernames
    custom_patterns: [
      /^(admin|mod|system|bot|test|demo)/i, // No empezar con palabras reservadas
      /\d{10,}/, // No permitir números largos (podrían ser teléfonos)
      /(buythetop|btop|ranking|top\d+)/i // No usar variaciones del nombre de la plataforma
    ]
  },

  display_name: {
    // Para display names, moderadamente estricto
    blocked_categories: [
      'immediate_action',
      'manual_review'
    ],
    max_warnings: 1,
    custom_patterns: [
      /^(owner|ceo|founder|creator|admin)/i, // No roles de autoridad
      /(official|oficial|verified|verificado)/i // No términos que impliquen verificación
    ]
  },

  bio: {
    // Para bios, más permisivo pero vigilar contenido específico
    blocked_categories: [
      'immediate_action'
    ],
    max_warnings: 2,
    custom_patterns: [
      /(contact|contacto).*(whatsapp|telegram|discord)/i, // No promocionar contacto externo
      /(follow|sigue).*(instagram|twitter|tiktok)/i, // No promocionar redes sociales agresivamente
      /https?:\/\/(?!buythetop\.vip)[^\s]+/gi // Solo permitir enlaces internos de la plataforma
    ]
  }
}

// Mensajes personalizados en español e inglés
export const CUSTOM_ERROR_MESSAGES = {
  es: {
    username: {
      blocked: 'El nombre de usuario contiene contenido prohibido',
      reserved: 'Este nombre de usuario está reservado para el sistema',
      manipulation: 'El nombre de usuario no puede hacer referencia a manipulación del ranking',
      suggestion: 'Elige un nombre único que te represente positivamente'
    },
    display_name: {
      blocked: 'El nombre de visualización contiene contenido inapropiado',
      authority: 'No puedes usar títulos o roles de autoridad en tu nombre',
      suggestion: 'Usa un nombre amigable y apropiado para la comunidad'
    },
    bio: {
      blocked: 'La biografía contiene contenido severamente prohibido',
      promotional: 'La biografía no puede contener promoción excesiva de contenido externo',
      suggestion: 'Describe tus intereses y mantén un tono positivo'
    }
  },
  en: {
    username: {
      blocked: 'Username contains prohibited content',
      reserved: 'This username is reserved for system use',
      manipulation: 'Username cannot reference ranking manipulation',
      suggestion: 'Choose a unique name that represents you positively'
    },
    display_name: {
      blocked: 'Display name contains inappropriate content',
      authority: 'You cannot use authority titles or roles in your name',
      suggestion: 'Use a friendly name appropriate for the community'
    },
    bio: {
      blocked: 'Bio contains severely prohibited content',
      promotional: 'Bio cannot contain excessive promotion of external content',
      suggestion: 'Describe your interests and maintain a positive tone'
    }
  }
}

// Función para obtener configuración según el tipo de contenido
export function getContentTypeConfig(contentType: 'username' | 'display_name' | 'bio') {
  return CONTENT_TYPE_CONFIG[contentType] || CONTENT_TYPE_CONFIG.bio
}

// Función para verificar si una palabra está específicamente permitida en la plataforma
export function isWordAllowedInPlatform(word: string): boolean {
  const normalizedWord = word.toLowerCase().trim()
  return PLATFORM_ALLOWED_WORDS.some(allowed => 
    normalizedWord === allowed.toLowerCase() ||
    normalizedWord.includes(allowed.toLowerCase())
  )
}

// Función para obtener mensaje de error personalizado
export function getCustomErrorMessage(
  contentType: 'username' | 'display_name' | 'bio',
  errorType: string,
  language: 'es' | 'en' = 'es'
): string {
  const messages = CUSTOM_ERROR_MESSAGES[language]
  const typeMessages = messages[contentType]
  
  return typeMessages[errorType as keyof typeof typeMessages] || 
         'El contenido no es apropiado para la plataforma'
}

// Configuración de rate limiting para reportes de contenido
export const CONTENT_REPORT_LIMITS = {
  max_reports_per_user_per_day: 5,
  max_reports_per_target_per_day: 3,
  cooldown_period_minutes: 15,
  auto_moderate_threshold: 3, // Número de reportes para activar moderación automática
  auto_ban_threshold: 10 // Número de reportes para ban automático temporal
}

// Configuración de logging y monitoreo
export const MONITORING_CONFIG = {
  log_all_violations: true,
  log_level: 'warn' as 'info' | 'warn' | 'error',
  include_user_agent: true,
  include_ip_address: false, // Por privacidad
  include_full_content: false, // Por privacidad, solo loggear fragmentos
  alert_on_high_severity: true,
  alert_threshold_per_hour: 10 // Alertar si hay más de X violaciones por hora
}
