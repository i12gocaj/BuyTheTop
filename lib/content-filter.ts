/**
 * Sistema de filtro de contenido para palabras prohibidas
 * Protege nombres de usuario, nombres de visualización y biografías
 */

// Categorías de palabras prohibidas
export const PROHIBITED_WORDS = {
  // Palabras relacionadas con drogas y sustancias ilegales
  drugs: [
    'cocaine', 'cocaina', 'coke', 'crack', 'heroin', 'heroina', 'meth', 'cannabis', 
    'marihuana', 'marijuana', 'weed', 'pot', 'hash', 'lsd', 'ecstasy', 'mdma',
    'molly', 'amphetamine', 'anfetamina', 'opioid', 'opioide', 'fentanyl',
    'morphine', 'morfina', 'ketamine', 'ketamina', 'pcp', 'ghb', 'rohypnol',
    'dealer', 'drug', 'droga', 'narcotic', 'narcotico', 'pills', 'pastillas',
    // Adicionales en español y slang
    'drogas', 'drogo', 'drogadicto', 'adicto', 'toxicomano', 'yonqui',
    'camello', 'traficante', 'narco', 'narcotraficante', 'capo',
    'porro', 'churro', 'canuto', 'joint', 'blunt', 'hierba', 'mota',
    'coca', 'nieve', 'polvo', 'blanca', 'perico', 'farlopa', 'speed',  
    'crystal', 'ice', 'cristal', 'meta', 'anfeta', 'extasis', 'pastis',
    'acido', 'tripi', 'tab', 'dosis', 'chute', 'pico', 'caballo',
    'heroina', 'jaco', 'chino', 'brown', 'tar', 'smack', 'skag',
    'oxy', 'oxycontin', 'percocet', 'vicodin', 'tramadol', 'codeine',
    'xanax', 'valium', 'rohypnol', 'rufilin', 'burundanga', 'escopolamina',
    'bazuco', 'paco', 'pasta', 'piedra', 'rock', 'base', 'free',
    'synthetic', 'sinteticas', 'sales', 'spice', 'k2', 'flakka',
    'poppers', 'rush', 'nitrato', 'inhalante', 'solvente', 'pegamento'
  ],

  // Contenido sexual explícito y pornográfico
  sexual: [
    'porn', 'porno', 'xxx', 'sex', 'sexo', 'nude', 'naked', 'desnudo',
    'penis', 'vagina', 'dick', 'cock', 'pussy', 'fuck', 'fucking', 'joder',
    'bitch', 'puta', 'whore', 'slut', 'zorra', 'prostitute', 'prostituta',
    'orgasm', 'orgasmo', 'masturbate', 'masturbar', 'blowjob', 'anal',
    'boobs', 'tits', 'tetas', 'ass', 'culo', 'breast', 'seno', 'nipple',
    'escort', 'milf', 'dildo', 'vibrator', 'condom', 'preservativo',
    // Adicionales en español
    'sexo', 'sexual', 'erótico', 'erotico', 'cachondo', 'caliente', 'horny',
    'follar', 'coger', 'chingar', 'tirar', 'culear', 'joder', 'penetrar',
    'correrse', 'venirse', 'pajero', 'paja', 'masturbacion', 'polvo',
    'mamada', 'chupada', 'lamida', 'chupar', 'lamer', 'mamar',
    'pene', 'verga', 'polla', 'pito', 'miembro', 'falo', 'rabo',
    'vagina', 'coño', 'concha', 'chocho', 'vulva', 'clitoris',
    'nalgas', 'trasero', 'pompis', 'cola', 'gluteos', 'ano',
    'senos', 'pechos', 'chichis', 'lolas', 'ubres', 'pezon', 'pezones',
    // Términos en inglés adicionales
    'horny', 'sexy', 'naughty', 'kinky', 'fetish', 'bdsm', 'bondage',
    'threesome', 'gangbang', 'orgy', 'orgía', 'swingers', 'swinger',
    'cumshot', 'facial', 'creampie', 'bukkake', 'handjob', 'footjob',
    'lesbian', 'gay', 'bisexual', 'transgender', 'trans', 'shemale',
    'webcam', 'cam', 'camgirl', 'stripper', 'striptease', 'lapdance',
    'onlyfans', 'chaturbate', 'pornhub', 'xvideos', 'redtube',
    'playboy', 'hustler', 'penthouse', 'adult', 'adultos', 'mature',
    'teen', 'joven', 'schoolgirl', 'colegiala', 'barely', 'legal'
  ],

  // Discurso de odio y discriminación
  hate: [
    'nazi', 'hitler', 'genocide', 'genocidio', 'terrorist', 'terrorista',
    'kill', 'matar', 'die', 'muerte', 'murder', 'asesinar', 'rape', 'violar',
    'torture', 'tortura', 'bomb', 'bomba', 'shoot', 'disparar', 'weapon',
    'arma', 'gun', 'pistola', 'rifle', 'knife', 'cuchillo', 'suicide',
    'suicidio', 'hang', 'colgar', 'lynch', 'linchar',
    // Adicionales de odio y violencia
    'hate', 'odio', 'odiar', 'desprecio', 'despreciar', 'racista', 'racism',
    'fascist', 'fascista', 'supremacist', 'supremacista', 'xenofobia', 'xenophobia',
    'holocaust', 'holocausto', 'concentration', 'concentracion', 'exterminar',
    'execute', 'ejecutar', 'assassinate', 'asesinar', 'massacre', 'masacre',
    'slaughter', 'matanza', 'carnage', 'carniceria', 'bloodbath', 'baño', 'sangre',
    'violence', 'violencia', 'violent', 'violento', 'brutal', 'savage', 'salvaje',
    'attack', 'atacar', 'assault', 'agredir', 'beat', 'golpear', 'punch', 'puñetazo',
    'stab', 'apuñalar', 'strangle', 'estrangular', 'suffocate', 'asfixiar',
    'burn', 'quemar', 'fire', 'fuego', 'explosion', 'explotar', 'dynamite',
    'grenade', 'granada', 'missile', 'misil', 'nuclear', 'atomic', 'atomico',
    'terror', 'terrorism', 'terrorismo', 'jihad', 'radical', 'extremist',
    'militant', 'militante', 'insurgent', 'insurgente', 'rebel', 'rebelde',
    'revolution', 'revolucion', 'coup', 'golpe', 'overthrow', 'derrocar'
  ],

  // Palabras relacionadas con actividades ilegales
  illegal: [
    'scam', 'estafa', 'fraud', 'fraude', 'steal', 'robar', 'theft', 'robo',
    'hack', 'hackear', 'piracy', 'pirateria', 'counterfeit', 'falsificar',
    'money', 'laundering', 'lavado', 'dinero', 'bribe', 'soborno',
    'blackmail', 'chantaje', 'ransom', 'rescate', 'smuggle', 'contrabando',
    'trafficking', 'trafico', 'cartel', 'mafia', 'gang', 'pandilla',
    // Actividades ilegales adicionales
    'criminal', 'crime', 'crimen', 'delito', 'delincuente', 'ladron',
    'ratero', 'chorizo', 'mangante', 'carterista', 'atracador',
    'asaltante', 'secuestrador', 'kidnap', 'secuestro', 'extorsion',
    'extortion', 'protection', 'proteccion', 'racket', 'racketeering',
    'corruption', 'corrupcion', 'embezzlement', 'malversacion', 'tax',
    'evasion', 'evasión', 'fiscal', 'offshore', 'paraiso', 'fiscal',
    'smuggling', 'contraband', 'bootleg', 'bootlegger', 'moonshine',
    'forgery', 'falsificacion', 'identity', 'theft', 'phishing',
    'ponzi', 'pyramid', 'scheme', 'esquema', 'piramidal', 'timo',
    'conman', 'swindler', 'charlatan', 'timador',
    'insider', 'trading', 'securities', 'valores', 'manipulation',
    'market', 'mercado', 'pump', 'dump', 'cryptocurrency', 'crypto',
    // Organizaciones criminales
    'cosa', 'nostra', 'yakuza', 'triad', 'bratva', 'camorra',
    'ndrangheta', 'sicilian', 'russian', 'mexican', 'colombian'
  ],

  // Spam y contenido promocional no deseado (SOLO frases completas para evitar falsos positivos)
  spam: [
    'comprar ahora', 'sale now', 'venta especial', 'discount code', 'codigo descuento', 
    'oferta limitada', 'deal expires', 'precio especial', 'cheap pills', 'pastillas baratas',
    'free money', 'dinero gratis', 'win prizes', 'ganar premios', 'lottery winner', 
    'ganador loteria', 'casino bonus', 'apostar aqui', 'gambling site', 'click here now',
    'clic aqui ahora', 'subscribe now', 'suscribir ahora', 'follow for more', 'seguir para mas'
  ],

  // Palabras relacionadas con acoso y bullying (ELIMINANDO orientaciones sexuales legítimas)
  harassment: [
    'ugly', 'feo', 'stupid', 'estupido', 'idiot', 'idiota', 'loser',
    'perdedor', 'fat', 'gordo', 'skinny', 'flaco', 'retard', 'retrasado',
    'faggot', 'marica', 'homo slur', 'dyke slur', 'tranny slur',
    // REMOVIDO: 'gay', 'lesbian', 'transgender' - estas son identidades legítimas, no insultos
    'midget', 'enano', 'cripple', 'tullido',
    // Más insultos y acoso en español
    'gilipollas', 'gilipolla', 'capullo', 'subnormal', 'anormal', 'tarado',
    'imbecil', 'cretino', 'mongolo', 'deficiente', 'minusvalido', 'invalido',
    'inutil', 'fracasado', 'patético', 'patetico', 'ridiculo', 'ridicula',
    'miserable', 'desgraciado', 'cabrón', 'cabron', 'hijoputa', 'hijo', 'puta',
    'jilipollas', 'mamón', 'mamon', 'payaso', 'estúpida', 'estupida',
    'mentiroso', 'mentirosa', 'falso', 'falsa', 'hipócrita', 'hipocrita',
    'cobarde', 'medroso', 'gallina', 'maricón', 'maricon', 'bollera',
    'tortillera', 'travesti', 'transformista', 'drag', 'queen',
    // Insultos en inglés adicionales
    'moron', 'imbecile', 'dumbass', 'dumb', 'ass', 'jackass', 'asshole',
    'bastard', 'bitch', 'son', 'of', 'a', 'bitch', 'motherfucker', 'fucker',
    'dipshit', 'shit', 'crap', 'damn', 'hell', 'freak', 'weirdo', 'creep',
    'psycho', 'crazy', 'insane', 'mental', 'sick', 'twisted', 'pervert',
    'pedophile', 'pedo', 'molester', 'rapist', 'abuser', 'stalker',
    // Términos discriminatorios
    'nigger', 'nigga', 'negro', 'spic', 'wetback', 'chink', 'gook',
    'kike', 'jew', 'judio', 'muslim', 'musulman', 'terrorist', 'terrorista'
  ],

  // Información personal sensible (patrones)
  personal: [
    'ssn', 'social', 'security', 'seguridad', 'passport', 'pasaporte',
    'license', 'licencia', 'credit', 'credito', 'card', 'tarjeta',
    'account', 'cuenta', 'password', 'contraseña', 'pin', 'code', 'codigo'
  ],

  // Marcas y derechos de autor comunes
  copyright: [
    'nintendo', 'sony', 'microsoft', 'apple', 'google', 'facebook',
    'instagram', 'twitter', 'youtube', 'tiktok', 'disney', 'marvel',
    'coca', 'cola', 'pepsi', 'mcdonalds', 'burger', 'king'
  ],

  // Palabras relacionadas con extremismo político
  extremism: [
    'communist', 'comunista', 'fascist', 'fascista', 'dictator', 'dictador',
    'revolution', 'revolucion', 'overthrow', 'derrocar', 'uprising',
    'levantamiento', 'rebellion', 'rebelion', 'anarchy', 'anarquia'
  ],

  // Palabras reservadas del sistema
  system: [
    'admin', 'administrator', 'administrador', 'moderator', 'moderador',
    'system', 'sistema', 'root', 'super', 'user', 'usuario', 'test',
    'demo', 'example', 'ejemplo', 'null', 'undefined', 'delete',
    'eliminar', 'banned', 'prohibido', 'suspended', 'suspendido'
  ]
}

// Palabras completamente prohibidas (bloqueo total)
export const BLOCKED_WORDS = [
  ...PROHIBITED_WORDS.drugs,
  ...PROHIBITED_WORDS.sexual,
  ...PROHIBITED_WORDS.hate,
  ...PROHIBITED_WORDS.illegal,
  ...PROHIBITED_WORDS.harassment,
  ...PROHIBITED_WORDS.extremism
]

// Palabras que requieren moderación (advertencia)
export const FLAGGED_WORDS = [
  ...PROHIBITED_WORDS.spam,
  ...PROHIBITED_WORDS.personal,
  ...PROHIBITED_WORDS.copyright,
  ...PROHIBITED_WORDS.system
]

// Patrones regex para detectar variaciones y evasión
export const EVASION_PATTERNS = [
  // Números mezclados con letras
  /[a-z]*[0-9]+[a-z]*/gi,
  // Caracteres especiales repetidos
  /(.)\1{3,}/gi,
  // Espacios o puntos entre letras (p.o.r.n.o, s.e.x, etc.)
  /[a-z][\s.\-_*#@!?+=/\\(){}[\]]{1,3}[a-z][\s.\-_*#@!?+=/\\(){}[\]]{1,3}[a-z]/gi,
  // Leetspeak común (4 por a, 3 por e, 1 por i, 0 por o)
  /[a4@][a4@]*[e3€][e3€]*[i1!|][i1!|]*[o0][o0]*/gi,
  // Palabras con prefijo de símbolos (.sex, *porn, #drug, etc.)
  /^[\s.\-_*#@!?+=/\\(){}[\]]+[a-z]{3,}/gi,
  // Palabras con sufijo de símbolos (sex., porn*, drug#, etc.)
  /[a-z]{3,}[\s.\-_*#@!?+=/\\(){}[\]]+$/gi,
  // Repetición de caracteres para ocultar palabras (sssseeeexxxx)
  /([a-z])\1{2,}/gi
]

/**
 * Detecta y normaliza intentos comunes de evasión de filtros
 */
function detectEvasionAttempts(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  let normalized = text.toLowerCase()
  
  // Detectar y normalizar patrones de evasión específicos
  EVASION_PATTERNS.forEach(pattern => {
    normalized = normalized.replace(pattern, (match) => {
      // Eliminar caracteres no alfabéticos del match
      return match.replace(/[^a-z]/g, '')
    })
  })
  
  return normalized
}

/**
 * Normaliza texto para análisis de contenido
 */
export function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  return text
    .toLowerCase()
    .trim()
    // Reemplazar caracteres especiales comunes usados para evadir filtros
    .replace(/[4@]/g, 'a')
    .replace(/[3€]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[6]/g, 'g')
    .replace(/[8]/g, 'b')
    .replace(/[\u00e0-\u00e6]/g, 'a') // á, à, â, ã, ä, å, æ
    .replace(/[\u00e8-\u00eb]/g, 'e') // é, è, ê, ë
    .replace(/[\u00ec-\u00ef]/g, 'i') // í, ì, î, ï
    .replace(/[\u00f2-\u00f6]/g, 'o') // ó, ò, ô, õ, ö
    .replace(/[\u00f9-\u00fc]/g, 'u') // ú, ù, û, ü
    .replace(/[\u00f1]/g, 'n') // ñ
    // Eliminar caracteres de separación comunes al principio y final
    .replace(/^[\s.\-_*#@!?+=/\\(){}[\]]+/g, '')
    .replace(/[\s.\-_*#@!?+=/\\(){}[\]]+$/g, '')
    // Eliminar espacios, puntos, guiones y otros separadores entre letras (múltiples pasadas)
    .replace(/([a-z])[\s.\-_*#@!?+=/\\(){}[\]]+([a-z])/g, '$1$2')
    .replace(/([a-z])[\s.\-_*#@!?+=/\\(){}[\]]+([a-z])/g, '$1$2')
    .replace(/([a-z])[\s.\-_*#@!?+=/\\(){}[\]]+([a-z])/g, '$1$2')
    // Eliminar caracteres repetidos usados para evasión (ej: s...e...x)
    .replace(/([a-z])[\s.\-_*#@!?+=/\\(){}[\]]*\1+/g, '$1')
    // Normalizar espacios múltiples
    .replace(/\s+/g, ' ')
}

/**
 * Verifica si el texto contiene palabras prohibidas
 */
export function containsProhibitedWords(text: string): {
  isBlocked: boolean
  isFlagged: boolean
  blockedWords: string[]
  flaggedWords: string[]
  severity: 'none' | 'low' | 'medium' | 'high'
} {
  if (!text || typeof text !== 'string') {
    return {
      isBlocked: false,
      isFlagged: false,
      blockedWords: [],
      flaggedWords: [],
      severity: 'none'
    }
  }

  // Primero detectar intentos de evasión
  const evasionNormalized = detectEvasionAttempts(text)
  const normalizedText = normalizeText(evasionNormalized)
  const words = normalizedText.split(/\s+/)
  const blockedWords: string[] = []
  const flaggedWords: string[] = []
  
  // También analizar el texto original sin espacios para detectar evasiones más sofisticadas
  const compactText = normalizeText(text.replace(/\s/g, ''))
  const allTextVariants = [normalizedText, compactText]



  // Verificar cada palabra del texto y también las variantes completas
  const allWordsToCheck = [...words, ...allTextVariants]
  
  for (const word of allWordsToCheck) {
    if (!word || word.length < 2) continue // Saltar palabras muy cortas
    
    // Verificar BLOCKED_WORDS con lógica mejorada
    for (const blocked of BLOCKED_WORDS) {
      const normalizedBlocked = normalizeText(blocked)
      
      // Detectar si la palabra prohibida está presente
      const isExactMatch = word === normalizedBlocked
      
      // Lógica más inteligente para subcadenas
      let isSubstringMatch = false
      if (normalizedBlocked.length >= 4) {
        // Para palabras de 4+ letras, permitir subcadenas pero con contexto
        if (word.includes(normalizedBlocked)) {
          // Verificar que no sea parte de una palabra legítima más larga
          const wordLength = word.length
          const blockedLength = normalizedBlocked.length
          
          // Si la palabra es significativamente más larga, podría ser legítima
          if (wordLength > blockedLength + 3) {
            // Verificar si está al principio, medio o final
            const atStart = word.startsWith(normalizedBlocked)
            const atEnd = word.endsWith(normalizedBlocked)
            const inMiddle = !atStart && !atEnd && word.includes(normalizedBlocked)
            
            // Solo bloquear si está al principio o final, no en medio de palabras largas
            isSubstringMatch = atStart || atEnd
          } else {
            isSubstringMatch = true
          }
        }
      } else if (normalizedBlocked.length === 3) {
        // Para palabras de 3 letras, solo coincidencias exactas
        isSubstringMatch = word === normalizedBlocked
      }
      
      if (isExactMatch || isSubstringMatch) {
        // Excepciones MUY específicas y limitadas - priorizar seguridad
        const isLegitimateException = (
          // Solo "gay" en palabras exactas "gaming" o "gamer" - NADA MÁS
          (normalizedBlocked === 'gay' && (word === 'gaming' || word === 'gamer')) ||
          // Solo "buy" cuando es exactamente "buythetop"
          (normalizedBlocked === 'buy' && word === 'buythetop') ||
          // Solo palabras de 2 chars o menos cuando están completamente solas
          (normalizedBlocked.length <= 2 && word === normalizedBlocked && word.length <= 2) ||
          // Preposiciones y palabras muy comunes en español e inglés (solo coincidencias exactas)
          (normalizedBlocked.length === 3 && word === normalizedBlocked && 
           ['con', 'por', 'sin', 'son', 'van', 'dan', 'don', 'dos', 'una', 'uno', 'del', 'las', 'los', 
            'the', 'and', 'for', 'you', 'are', 'can', 'may', 'has', 'had', 'was', 'but', 'not', 'all',
            'any', 'new', 'old', 'big', 'top', 'low', 'way', 'day', 'get', 'got', 'let', 'put', 'see',
            'say', 'end', 'use', 'run', 'try', 'now', 'how', 'why', 'who', 'own', 'man', 'men', 'boy',
            'car', 'dog', 'cat', 'sun', 'sea', 'air', 'art', 'law', 'war', 'job', 'age', 'bad', 'far'].includes(normalizedBlocked))
        )
        
        if (!isLegitimateException) {
          if (!blockedWords.includes(blocked)) {
            blockedWords.push(blocked)
          }
        }
      }
    }
    
    // Verificar FLAGGED_WORDS con la misma lógica
    for (const flagged of FLAGGED_WORDS) {
      const normalizedFlagged = normalizeText(flagged)
      
      const isExactMatch = word === normalizedFlagged
      
      // Lógica más inteligente para subcadenas (misma que blocked words)
      let isSubstringMatch = false
      if (normalizedFlagged.length >= 4) {
        if (word.includes(normalizedFlagged)) {
          const wordLength = word.length
          const flaggedLength = normalizedFlagged.length
          
          if (wordLength > flaggedLength + 3) {
            const atStart = word.startsWith(normalizedFlagged)
            const atEnd = word.endsWith(normalizedFlagged)
            isSubstringMatch = atStart || atEnd
          } else {
            isSubstringMatch = true
          }
        }
      } else if (normalizedFlagged.length === 3) {
        isSubstringMatch = word === normalizedFlagged
      }
      
      if (isExactMatch || isSubstringMatch) {
        // Mismas excepciones limitadas para flagged words
        const isLegitimateException = (
          (normalizedFlagged === 'gay' && (word === 'gaming' || word === 'gamer')) ||
          (normalizedFlagged === 'buy' && word === 'buythetop') ||
          (normalizedFlagged.length <= 2 && word === normalizedFlagged && word.length <= 2) ||
          // Preposiciones y palabras muy comunes en español e inglés (solo coincidencias exactas)
          (normalizedFlagged.length === 3 && word === normalizedFlagged && 
           ['con', 'por', 'sin', 'son', 'van', 'dan', 'don', 'dos', 'una', 'uno', 'del', 'las', 'los',
            'the', 'and', 'for', 'you', 'are', 'can', 'may', 'has', 'had', 'was', 'but', 'not', 'all',
            'any', 'new', 'old', 'big', 'top', 'low', 'way', 'day', 'get', 'got', 'let', 'put', 'see',
            'say', 'end', 'use', 'run', 'try', 'now', 'how', 'why', 'who', 'own', 'man', 'men', 'boy',
            'car', 'dog', 'cat', 'sun', 'sea', 'air', 'art', 'law', 'war', 'job', 'age', 'bad', 'far'].includes(normalizedFlagged))
        )
        
        if (!isLegitimateException) {
          if (!flaggedWords.includes(flagged)) {
            flaggedWords.push(flagged)
          }
        }
      }
    }
  }

  // Verificar texto completo para frases prohibidas
  for (const blocked of BLOCKED_WORDS) {
    const normalizedBlocked = normalizeText(blocked)
    if (normalizedText.includes(normalizedBlocked) && normalizedBlocked.length >= 3) {
      if (!blockedWords.includes(blocked)) {
        blockedWords.push(blocked)
      }
    }
  }

  // Determinar severidad
  let severity: 'none' | 'low' | 'medium' | 'high' = 'none'
  if (blockedWords.length > 0) {
    if (blockedWords.some(word => 
      PROHIBITED_WORDS.hate.includes(word) || 
      PROHIBITED_WORDS.illegal.includes(word)
    )) {
      severity = 'high'
    } else if (blockedWords.some(word => 
      PROHIBITED_WORDS.sexual.includes(word) ||
      PROHIBITED_WORDS.drugs.includes(word)
    )) {
      severity = 'medium'
    } else {
      severity = 'low'
    }
  } else if (flaggedWords.length > 0) {
    severity = 'low'
  }

  return {
    isBlocked: blockedWords.length > 0,
    isFlagged: flaggedWords.length > 0,
    blockedWords,
    flaggedWords,
    severity
  }
}

/**
 * Filtra y limpia el texto removiendo palabras prohibidas
 */
export function filterText(text: string, replacement: string = '***'): string {
  if (!text || typeof text !== 'string') return ''
  
  let filteredText = text
  const normalizedText = normalizeText(text)
  
  // Reemplazar palabras bloqueadas
  for (const blocked of BLOCKED_WORDS) {
    const normalizedBlocked = normalizeText(blocked)
    const regex = new RegExp(`\\b${normalizedBlocked.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    filteredText = filteredText.replace(regex, replacement)
  }
  
  return filteredText.trim()
}

/**
 * Valida contenido para nombres de usuario
 */
export function validateUsername(username: string): {
  isValid: boolean
  error?: string
  suggestion?: string
} {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' }
  }

  const result = containsProhibitedWords(username)
  
  if (result.isBlocked) {
    return {
      isValid: false,
      error: 'Username contains prohibited content',
      suggestion: 'Please choose a different username without inappropriate words'
    }
  }

  if (result.isFlagged && result.severity !== 'low') {
    return {
      isValid: false,
      error: 'Username may contain inappropriate content',
      suggestion: 'Please choose a more appropriate username'
    }
  }

  return { isValid: true }
}

/**
 * Valida contenido para nombres de visualización
 */
export function validateDisplayName(displayName: string): {
  isValid: boolean
  error?: string
  suggestion?: string
} {
  if (!displayName || typeof displayName !== 'string') {
    return { isValid: false, error: 'Display name is required' }
  }

  const result = containsProhibitedWords(displayName)
  
  if (result.isBlocked) {
    return {
      isValid: false,
      error: 'Display name contains prohibited content',
      suggestion: 'Please choose a different display name without inappropriate words'
    }
  }

  if (result.isFlagged && result.severity !== 'low') {
    return {
      isValid: false,
      error: 'Display name may contain inappropriate content',
      suggestion: 'Please choose a more appropriate display name'
    }
  }

  return { isValid: true }
}

/**
 * Valida contenido para biografías
 */
export function validateBio(bio: string): {
  isValid: boolean
  error?: string
  suggestion?: string
  filtered?: string
} {
  if (!bio || typeof bio !== 'string') {
    return { isValid: true } // Bio es opcional
  }

  const result = containsProhibitedWords(bio)
  
  // Para biografías, ser más permisivo - solo bloquear contenido realmente problemático
  if (result.isBlocked && result.severity === 'high') {
    return {
      isValid: false,
      error: 'Bio contains severely prohibited content',
      suggestion: 'Please remove inappropriate content from your bio'
    }
  }

  // Para biografías, permitir menciones de redes sociales y marcas
  if (result.isBlocked && result.severity !== 'high') {
    // Verificar si son solo palabras de redes sociales/marcas
    const socialMediaWords = ['instagram', 'twitter', 'facebook', 'youtube', 'tiktok', 'linkedin', 'snapchat', 'discord', 'telegram']
    const onlySocialMedia = result.blockedWords.every(word => 
      socialMediaWords.some(social => social.toLowerCase().includes(word.toLowerCase()) || word.toLowerCase().includes(social))
    )
    
    if (onlySocialMedia) {
      return { isValid: true } // Permitir redes sociales en biografías
    }
    
    // Para otros contenidos bloqueados de severidad media/baja, ofrecer versión filtrada
    const filtered = filterText(bio)
    return {
      isValid: false,
      error: 'Bio contains prohibited words',
      suggestion: 'Please review and modify your bio',
      filtered
    }
  }

  // Las palabras flagged son permitidas en biografías
  return { isValid: true }
}

/**
 * Función de utilidad para logging de contenido filtrado
 */
export function logContentFilter(
  userId: string,
  contentType: 'username' | 'display_name' | 'bio',
  originalContent: string,
  filterResult: ReturnType<typeof containsProhibitedWords>
) {
  if (filterResult.isBlocked || filterResult.isFlagged) {
    console.warn(`🚫 Content filter triggered:`, {
      userId,
      contentType,
      severity: filterResult.severity,
      blockedWords: filterResult.blockedWords,
      flaggedWords: filterResult.flaggedWords,
      timestamp: new Date().toISOString()
    })
  }
}
