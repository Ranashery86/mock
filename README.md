# Workflow Dashboard

A workflow dashboard built with Next.js (App Router), shadcn/ui (Base UI), and Supabase Auth.

## Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **shadcn/ui** (`base-nova` preset, Base UI)
- **Supabase Auth** (`@supabase/ssr`) — email/password sign in only (no signup page)
- **next-themes** — light/dark/system theme toggle

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project and copy your credentials into `.env.local`
   (see `.env.example`):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Create a user in Supabase Auth:

   - Supabase Dashboard → **Authentication → Users → Add user**,
   - or via SQL:

     ```sql
     select auth.admin_create_user(
       'email' => 'you@example.com',
       'password' => 'a-strong-password'
     );
     ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000). You will be redirected
   to `/login`; sign in with the credentials from step 3.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — run ESLint

## Project structure

```
src/
  app/
    (app)/          # authenticated dashboard shell (protected)
    login/          # email/password sign in
    layout.tsx      # root layout (theme provider, toaster)
  components/
    ui/             # shadcn/ui components
    app-sidebar.tsx # desktop sidebar
    mobile-nav.tsx  # mobile sheet navigation
    top-bar.tsx     # header (theme toggle, user menu)
    user-menu.tsx   # server component → user menu
  lib/supabase/     # browser + server Supabase clients
  proxy.ts          # route protection (Next 16 proxy convention)
```

## How auth works

- **`src/proxy.ts`** checks the session on every request via `getClaims()`:
  unauthenticated users are redirected to `/login`, authenticated users away
  from `/login`.
- **`src/lib/supabase/server.ts`** is used for server-side reads (user menu).
- **`src/lib/supabase/client.ts`** powers the client-side sign-in/sign-out
  flows.
- Never use the `service_role` key in this app.

> Note: server-side Supabase calls run at request time, so the app builds and
> starts even while `.env.local` is empty — but requests fail until the real
> credentials are set.

## Adding components

```bash
npx shadcn@latest add <component>
```"# mock" 
