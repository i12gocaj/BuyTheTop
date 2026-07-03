# BuyTheTop

A leaderboard where your position depends on how much you pay. The top contributor is first, the lowest contributor is last. If you want to climb, you pay.

It is a Next.js 15 + Supabase + Stripe app that was live at [buythetop.vip](https://buythetop.vip). The original database is paused in Supabase because I am currently using those resources for other projects, so this repository includes a complete SQL schema and a synthetic seed (50 users, 79 payments, position history) that lets anyone run it in their own Supabase project and get something close to the real version.

![Home page](docs/screenshots/01-home.png)

## What It Has

- Supabase Auth: sign up, login, email change with confirmation, password recovery, and `user` / `admin` roles.
- Stripe Checkout payments hosted by Stripe. The ranking is updated from the webhook, not from the client, so it cannot be faked.
- Position recalculation after every payment, with `position_history` for showing each user's climb on their profile.
- Resend emails: welcome email, password reset, and notification when someone overtakes you in the ranking (user-disableable).
- Admin panel with statistics, user editing, and position management, protected through a `role` column in `user_profiles` with RLS.
- Audit log for logins, payments, and admin actions in an `audit_logs` table readable only by admins.
- Security headers, CSRF, rate limiting, content filtering in bios, and client-side avatar compression.
- Deployed on Cloudflare Pages with the edge runtime.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn/ui · Supabase · Stripe · Resend · React Email · Zod · Cloudflare Pages.

## Running It

You need Node 20+, pnpm 9+, Docker (for local Supabase), and a Stripe account in test mode.

```bash
git clone https://github.com/i12gocaj/BuyTheTop.git
cd BuyTheTop
pnpm install

# Local Supabase with everything inside (Postgres + Auth + Studio)
supabase start
supabase db reset   # applies the migration and loads the seed

# Environment variables
cp .env.example .env.local
# fill in the keys: Supabase values come from `supabase status`,
# Stripe values come from the test-mode dashboard

pnpm dev
```

If you prefer cloud Supabase instead of Docker, open the SQL editor and paste [`supabase/schema.sql`](supabase/schema.sql), then [`supabase/seed.sql`](supabase/seed.sql).

### Seed Accounts

| Email | Password | Role | Position |
| --- | --- | --- | --- |
| `admin@buythetop.demo` | `Admin1234!` | admin | #24 |
| `demo@buythetop.demo` | `Demo1234!` | user | #3 |

The other 48 users exist as leaderboard entries but cannot log in. They are included so the leaderboard has data.

## Screen Walkthrough

### Home Page

The leaderboard. The top three have special styling (gold, silver, bronze). Below that, the list is paginated 10 by 10, with name and bio search in the top bar. The header shows total contributors and money raised live, and changes depending on whether the user is logged in.

![Home page](docs/screenshots/01-home.png)

Search filters by name and bio:

![Search](docs/screenshots/11-search.png)

### Login and Sign Up

Email and password through Supabase Auth. Sign up sends a confirmation email. The login screen includes "forgot password", linked to the email-based reset flow.

![Login](docs/screenshots/02-login.png)

![Sign up](docs/screenshots/03-signup.png)

### Your Profile

This is where users manage their presence: upload an avatar (with client-side compression to avoid sending 5 MB files to the server), edit name and bio, and change email with two-step confirmation. On the right, they can see stats (current position, total contributed, time in position), a "Position Status" block showing who they need to overtake and by how much, payment history, and position history.

![Profile](docs/screenshots/04-profile.png)

### Climbing the Ranking

The contribution page shows the position you will reach *before* paying, with the new total already calculated. It includes quick amount buttons (1, 5, 10, 25, 50, 100, 250, 500) and a custom input. Clicking "Proceed to Payment" redirects to Stripe Checkout; when the payment is confirmed, the webhook updates the ranking and writes the corresponding row in `position_history`.

![Contribute](docs/screenshots/05-contribute.png)

### Payment Confirmed

Thank-you screen after a successful payment. It shows the amount and Stripe session ID, then links back to the ranking and profile. It also fires purchase events to GA4 and Meta Pixel.

![Payment confirmed](docs/screenshots/09-payment-success.png)

### Admin Panel

Only accessible if the user's row in `user_profiles` has `role = 'admin'`. The check runs in the client (redirects non-admins) and in API routes (RLS + middleware), so changing the URL is not enough.

Statistics tab:

![Admin · statistics](docs/screenshots/06-admin-stats.png)

User management: edit name, bio, and avatar; promote to admin; delete account. The demo user appears as `user`, and `CrownKeeper` (admin) has no delete button to prevent self-deletion.

![Admin · users](docs/screenshots/07-admin-users.png)

Position management: complete list ordered by contribution, with a "Fix Positions" action that recalculates every position from scratch. Useful if a transaction leaves the ranking inconsistent.

![Admin · positions](docs/screenshots/08-admin-positions.png)

### Help and Mobile

Static help page explaining how the ranking works, the minimum contribution, and account management:

![Help](docs/screenshots/10-help.png)

Mobile design, with reordered podium and compact statistics:

![Mobile](docs/screenshots/12-mobile-home.png)

## Database

Five tables in `public`, all with RLS enabled:

| Table | Purpose |
| --- | --- |
| `user_profiles` | Visible user data, linked 1:1 with `auth.users`. Includes `role`. |
| `rankings` | One row per user with `total_contribution`, `current_position`, and `position_acquired_at`. |
| `payments` | Every Stripe payment. Indexed by `payment_intent_id` to avoid duplicates. |
| `position_history` | Append-only: every position change with `old_position`, `new_position`, and `contribution_amount`. |
| `audit_logs` | Sensitive events (`LOGIN`, `PAYMENT_COMPLETED`, etc.) readable only by admins. |

The full DDL is in [`supabase/schema.sql`](supabase/schema.sql), and synthetic data is in [`supabase/seed.sql`](supabase/seed.sql).

## Structure

```text
app/                    Next.js routes (App Router)
  admin/                Moderation panel
  api/                  Route handlers: auth, rankings, payments, webhooks
  auth/                 Login, sign-up, reset, confirm
  contribute/           Form + position preview
  payment/success/      Post-checkout confirmation
  profile/              Account, payments, and history
  help, contact,        Static pages
    privacy, terms/
components/             React components (server + client)
  ui/                   shadcn/ui primitives
docs/screenshots/       README images
hooks/                  use-analytics, use-toast, etc.
lib/                    Server actions, Supabase clients, validation
  email/                React Email templates + Resend service
  supabase/             Browser, server, and middleware clients
middleware.ts           Auth + security headers
supabase/
  config.toml           CLI config
  migrations/           SQL migrations
  schema.sql            Full DDL
  seed.sql              Seed with 50 users
wrangler.toml           Cloudflare Pages config
```

## Deployment

Prepared for Cloudflare Pages with `@cloudflare/next-on-pages`:

```bash
pnpm pages:build    # builds the edge bundle in .vercel/output
pnpm preview        # runs it locally with wrangler
pnpm deploy         # deploys it to Cloudflare Pages
```

Production needs the same variables as `.env.example`, plus `STRIPE_WEBHOOK_SECRET` pointing to the real endpoint configured in Stripe.

## License

MIT. See [`LICENSE`](LICENSE).
