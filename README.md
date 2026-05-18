# BuyTheTop

Un leaderboard donde tu posición depende de cuánto pagas. El que más
contribuye está arriba, el que menos abajo. Si quieres subir, pagas.

Es una app Next.js 15 + Supabase + Stripe que estuvo viva en
[buythetop.vip](https://buythetop.vip). La base de datos original está pausada
en Supabase porque tengo otros proyectos activos, así que el repo trae un
esquema SQL completo y un seed sintético (50 usuarios, 79 pagos, historial
de posiciones) para que cualquiera lo levante en su propio Supabase y se
parezca a la versión real.

![Página principal](docs/screenshots/01-home.png)

## Qué tiene

- Auth con Supabase: registro, login, cambio de email con confirmación,
  recuperación de contraseña, roles `user` y `admin`.
- Pagos con Stripe Checkout (alojado en Stripe). El ranking se actualiza
  desde el webhook, no desde el cliente, así que no se puede falsear.
- Recálculo de posiciones después de cada pago, con histórico
  (`position_history`) para mostrar el ascenso de cada usuario en su perfil.
- Emails con Resend: bienvenida, reset de contraseña y aviso cuando alguien
  te adelanta en el ranking (desactivable por usuario).
- Panel de administración con estadísticas, edición de usuarios y de
  posiciones, protegido por una columna `role` en `user_profiles` con RLS.
- Audit log de logins, pagos y acciones admin en una tabla `audit_logs` que
  solo el admin puede leer.
- Headers de seguridad, CSRF, rate limiting, filtro de contenido en los bios
  y compresión de avatares en cliente.
- Desplegado en Cloudflare Pages con runtime edge.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn/ui ·
Supabase · Stripe · Resend · React Email · Zod · Cloudflare Pages.

## Cómo levantarlo

Necesitas Node 20+, pnpm 9+, Docker (para Supabase local) y una cuenta de
Stripe en modo test.

```bash
git clone https://github.com/i12gocaj/BuyTheTop.git
cd BuyTheTop
pnpm install

# Supabase local con todo dentro (Postgres + Auth + Studio)
supabase start
supabase db reset   # aplica la migración y carga el seed

# Variables de entorno
cp .env.example .env.local
# rellena las claves: las de Supabase salen de `supabase status`,
# las de Stripe del dashboard en modo test

pnpm dev
```

Si prefieres usar Supabase en la nube en lugar de Docker, abre el SQL editor
y pega [`supabase/schema.sql`](supabase/schema.sql) y después
[`supabase/seed.sql`](supabase/seed.sql).

### Cuentas que crea el seed

| Email                    | Password     | Rol   | Posición |
|--------------------------|--------------|-------|----------|
| `admin@buythetop.demo`   | `Admin1234!` | admin | #24      |
| `demo@buythetop.demo`    | `Demo1234!`  | user  | #3       |

Los otros 48 usuarios existen como entradas del ranking pero no se pueden
loguear, solo aparecen para que el leaderboard tenga datos.

## Recorrido por las pantallas

### Página principal

El leaderboard. Los tres primeros tienen estilo especial (oro, plata,
bronce). Debajo va la lista paginada de 10 en 10, con búsqueda por nombre o
bio en la barra superior. La cabecera muestra contribuidores totales y
dinero recaudado en directo, y cambia según si estás logueado o no.

![Página principal](docs/screenshots/01-home.png)

La búsqueda filtra por nombre y bio:

![Búsqueda](docs/screenshots/11-search.png)

### Login y registro

Email y contraseña sobre Supabase Auth. El registro manda un email de
confirmación. La pantalla de login tiene "olvidé la contraseña" enlazado al
flujo de reset que también va por email.

![Login](docs/screenshots/02-login.png)

![Registro](docs/screenshots/03-signup.png)

### Tu perfil

Aquí gestionas tu presencia: subes avatar (con compresión en cliente para
no mandar 5 MB al servidor), editas nombre y bio, y cambias el email
confirmándolo en dos pasos. A la derecha ves tus estadísticas (posición
actual, total aportado, tiempo en la posición), un bloque "Position Status"
que te dice a quién tienes que adelantar y por cuánto, el historial de
pagos y el historial de cambios de posición.

![Perfil](docs/screenshots/04-profile.png)

### Subir en el ranking

La página de contribuir te enseña en qué posición vas a quedar *antes* de
pagar, con el nuevo total ya calculado. Hay botones de cantidades rápidas
(1, 5, 10, 25, 50, 100, 250, 500) y un campo libre. Al pulsar "Proceed to
Payment" se te redirige a Stripe Checkout; cuando vuelve confirmado, el
webhook actualiza el ranking y escribe la fila correspondiente en
`position_history`.

![Contribuir](docs/screenshots/05-contribute.png)

### Pago confirmado

Pantalla de gracias después de un pago correcto. Muestra el importe y el
ID de sesión de Stripe, y enlaza al ranking y a tu perfil. Por debajo
dispara los eventos de compra a GA4 y Meta Pixel.

![Pago confirmado](docs/screenshots/09-payment-success.png)

### Panel de administración

Solo accesible si tu fila en `user_profiles` tiene `role = 'admin'`. La
comprobación se hace en el cliente (redirige si no eres admin) y también en
las API routes (RLS + middleware), así que no basta con tocar la URL.

Tab de estadísticas:

![Admin · estadísticas](docs/screenshots/06-admin-stats.png)

Gestión de usuarios: editar nombre, bio y avatar; promocionar a admin;
borrar la cuenta. El demo aparece como `user` y `CrownKeeper` (admin) sin
botón de borrar para no auto-eliminarse.

![Admin · usuarios](docs/screenshots/07-admin-users.png)

Gestión de posiciones: la lista completa ordenada por contribución, con la
opción "Fix Positions" que recalcula todas las posiciones desde cero (útil
si una transacción dejó el ranking inconsistente).

![Admin · posiciones](docs/screenshots/08-admin-positions.png)

### Ayuda y móvil

Página de ayuda estática que explica cómo funciona el ranking, la
contribución mínima y cómo gestionar la cuenta:

![Ayuda](docs/screenshots/10-help.png)

Y el diseño móvil, que reordena el podium y compacta las estadísticas:

![Móvil](docs/screenshots/12-mobile-home.png)

## Base de datos

Cinco tablas en `public`, todas con RLS activado:

| Tabla              | Para qué                                                                |
|--------------------|-------------------------------------------------------------------------|
| `user_profiles`    | Datos visibles del usuario, ligados 1:1 con `auth.users`. Incluye `role`. |
| `rankings`         | Una fila por usuario con `total_contribution`, `current_position` y `position_acquired_at`. |
| `payments`         | Cada pago de Stripe. Indexada por `payment_intent_id` para evitar duplicados. |
| `position_history` | Append-only: cada cambio de posición con `old_position`, `new_position` y `contribution_amount`. |
| `audit_logs`       | Eventos sensibles (`LOGIN`, `PAYMENT_COMPLETED`, etc.) que solo el admin puede leer. |

El DDL completo está en [`supabase/schema.sql`](supabase/schema.sql) y los
datos sintéticos en [`supabase/seed.sql`](supabase/seed.sql).

## Estructura

```
app/                    Rutas de Next (App Router)
  admin/                Panel de moderación
  api/                  Route handlers: auth, rankings, payments, webhooks
  auth/                 Login, sign-up, reset, confirm
  contribute/           Formulario + preview de posición
  payment/success/      Confirmación post-checkout
  profile/              Cuenta, pagos e historial
  help, contact,        Páginas estáticas
    privacy, terms/
components/             Componentes React (server + client)
  ui/                   Primitivas shadcn/ui
docs/screenshots/       Imágenes del README
hooks/                  use-analytics, use-toast, etc.
lib/                    Server actions, clientes Supabase, validación
  email/                Plantillas React Email + servicio Resend
  supabase/             Clientes browser, server y middleware
middleware.ts           Auth + headers de seguridad
supabase/
  config.toml           Config del CLI
  migrations/           Migraciones SQL
  schema.sql            DDL completo
  seed.sql              Seed de 50 usuarios
wrangler.toml           Config de Cloudflare Pages
```

## Despliegue

Está preparado para Cloudflare Pages con `@cloudflare/next-on-pages`:

```bash
pnpm pages:build    # construye el bundle edge en .vercel/output
pnpm preview        # lo corre local con wrangler
pnpm deploy         # lo sube a Cloudflare Pages
```

En producción necesitas las mismas variables de `.env.example`, además del
`STRIPE_WEBHOOK_SECRET` apuntando al endpoint real configurado en Stripe.

## Licencia

MIT. Detalles en [`LICENSE`](LICENSE).
