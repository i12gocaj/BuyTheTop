# Google Tag Manager - Configuración Completa

## 🎯 ¡Google Tag Manager Implementado!

Ya tienes el código GTM `GTM-M4WH5W6X` configurado en tu aplicación. Ahora sigue estos pasos para completar la configuración:

## 📋 Pasos Siguientes

### 1. ✅ Código ya Implementado
- ✅ Script de GTM añadido al `<head>`
- ✅ Iframe NoScript añadido al `<body>`
- ✅ Variables de entorno configuradas
- ✅ Eventos personalizados configurados

### 2. 🔧 Configurar Google Analytics en GTM

Ve a tu cuenta de Google Tag Manager y:

#### Paso 1: Crear Variable de Google Analytics
1. Ve a **Variables** → **Nueva**
2. Tipo: **Configuración de Google Analytics: GA4**
3. **Measurement ID**: Tu ID de GA4 (G-XXXXXXXXXX)
4. Nombre: `GA4 Configuration`

#### Paso 2: Crear Etiqueta de Google Analytics
1. Ve a **Etiquetas** → **Nueva**
2. Tipo: **Google Analytics: Evento GA4**
3. **Etiqueta de configuración**: Selecciona la variable creada arriba
4. **Nombre del evento**: `page_view`
5. **Activador**: `All Pages`

#### Paso 3: Configurar Eventos Personalizados
Crea estas etiquetas adicionales:

**Evento: Inicio de Proceso de Pago**
- Tipo: **Google Analytics: Evento GA4**
- Nombre del evento: `begin_checkout`
- Activador: **Evento personalizado** → `begin_checkout`

**Evento: Compra Completada**
- Tipo: **Google Analytics: Evento GA4**
- Nombre del evento: `purchase`
- Activador: **Evento personalizado** → `purchase`

**Evento: Registro de Usuario**
- Tipo: **Google Analytics: Evento GA4**
- Nombre del evento: `sign_up`
- Activador: **Evento personalizado** → `sign_up`

### 3. 📱 Configurar Facebook Pixel (Recomendado)

Para mejorar el seguimiento de Instagram/Meta:

#### Paso 1: Añadir Facebook Pixel
1. Ve a **Etiquetas** → **Nueva**
2. Tipo: **Facebook Pixel**
3. **Pixel ID**: Tu ID de Facebook Pixel
4. **Activador**: `All Pages`

#### Paso 2: Eventos de Conversión de Facebook
**Compra (Purchase):**
- Tipo: **Facebook Pixel**
- **Tipo de evento**: `Purchase`
- **Activador**: Evento personalizado → `purchase`
- **Parámetros**:
  - `value`: `{{Event - value}}`
  - `currency`: `EUR`

**Inicio de Proceso de Pago (InitiateCheckout):**
- Tipo: **Facebook Pixel**
- **Tipo de evento**: `InitiateCheckout`
- **Activador**: Evento personalizado → `begin_checkout`

### 4. 🔗 URLs para tus Campañas

Usa estas URLs en tus anuncios de Instagram/Meta:

```
https://buythetop.vip/?utm_source=instagram&utm_medium=video&utm_campaign=launch_2024&utm_content=premium_ranking&utm_term=buythetop
```

**Variaciones por tipo de contenido:**
```
# Instagram Stories
https://buythetop.vip/?utm_source=instagram&utm_medium=story&utm_campaign=launch_2024&utm_content=cta_swipeup

# Instagram Video Ads
https://buythetop.vip/?utm_source=instagram&utm_medium=video_ad&utm_campaign=launch_2024&utm_content=premium_showcase

# Facebook Feed
https://buythetop.vip/?utm_source=facebook&utm_medium=feed&utm_campaign=launch_2024&utm_content=newsfeed
```

## 📊 Eventos que se Envían Automáticamente

Tu aplicación ya envía estos eventos a GTM:

### Eventos de Navegación
- `page_view` - Cada vez que alguien ve una página
- `campaign_view` - Cuando alguien llega con parámetros UTM

### Eventos de Engagement
- `click_cta` - Clics en botones importantes
- `view_ranking` - Visualización del ranking
- `social_share` - Compartir en redes sociales

### Eventos de Conversión
- `sign_up` - Registro de nuevos usuarios
- `login` - Inicio de sesión
- `begin_checkout` - Inicio del proceso de pago
- `add_payment_info` - Información de pago añadida
- `purchase` - Compra completada

### Datos Incluidos Automáticamente
- Parámetros UTM completos
- IDs de Facebook/Instagram (fbclid, igshid)
- Información de página y dispositivo
- Timestamp y metadata

## 🚀 Verificar que Funciona

### 1. Modo de Vista Previa de GTM
1. En GTM, haz clic en **Vista previa**
2. Ingresa: `https://buythetop.vip`
3. Navega por tu sitio y verifica que se disparen los eventos

### 2. Extensión GTM/GA Debugger
Instala en Chrome:
- **Google Tag Assistant Legacy**
- **GA Debugger**

### 3. Consola del Navegador
Abre F12 → Console y busca mensajes como:
```
Analytics Event: page_view {...}
Analytics Event: campaign_view {...}
```

## 📈 Métricas en Google Analytics

Una vez configurado GA4 en GTM, podrás ver:

### Reportes → Adquisición
- **Adquisición de usuarios** por fuente/medio
- **Tráfico por campañas** específicas
- **Conversiones por canal** de marketing

### Reportes → Engagement
- **Eventos por página**
- **Engagement de usuarios** por fuente
- **Rutas de conversión**

### Reportes → Monetización
- **Compras de comercio electrónico**
- **Ingresos por campaña**
- **Valor de por vida del cliente**

## 🎯 Optimización de Campañas

### A/B Testing con UTM
```
# Versión A - CTA agresivo
utm_content=join_elite_now

# Versión B - CTA sutil  
utm_content=discover_more
```

### Segmentación por Audiencia
```
# Audiencia joven
utm_term=gen_z_premium

# Audiencia de lujo
utm_term=luxury_lifestyle
```

## ⚠️ Importante para Meta Ads

### En Meta Ads Manager:
1. **Píxel de Facebook**: También configúralo en GTM
2. **Eventos de conversión**: Se rastrearán automáticamente
3. **Audiencias personalizadas**: Se crearán con los datos recopilados

### URLs de Conversión:
- **Página de éxito**: `https://buythetop.vip/payment/success`
- **Página de registro**: `https://buythetop.vip/auth/sign-up`
- **Página principal**: `https://buythetop.vip`

## 🎉 ¡Listo para el Lanzamiento!

Tu configuración incluye:
- ✅ Google Tag Manager completamente implementado
- ✅ Tracking de campañas UTM automático
- ✅ Eventos de conversión configurados
- ✅ Compatibilidad con Facebook/Instagram
- ✅ Código listo para producción

Solo necesitas completar la configuración en la interfaz de GTM y ¡estarás listo para lanzar tu campaña publicitaria! 🚀