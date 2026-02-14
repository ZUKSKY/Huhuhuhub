# HuhuhuHub

HuhuhuHub adalah aplikasi curhat anonim berbasis Next.js dengan desain fun + modern.

## Fitur Utama

- Post curhat anonim dengan mood.
- Feed komunitas dengan reaction.
- 1 user/browser punya 1 reaction aktif per post (bisa diganti kapan saja).
- Report post dibatasi 1 kali per user/browser.
- Anti-spam rate limit di server/database.
- Journal pribadi tersimpan di cloud + bisa sinkron antar device via sync key.
- Hardening security database (RLS + revoke direct access + RPC execute terbatas service role).

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- CSS custom (glassmorphism)
- Supabase Postgres (RPC via API Route server-side)

## Setup Lokal

1. Install dependency:

```bash
npm install
```

2. Buat file `.env.local`:

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

3. Jalankan SQL schema terbaru:

- `docs/supabase-hub-schema.sql`

4. Jalankan project:

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Setup Database Gratis (Vercel-ready)

Panduan lengkap ada di:

- `docs/VERCEL_DATABASE_SETUP.md`
- `docs/supabase-hub-schema.sql`

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Import project ke Vercel.
3. Tambahkan env var berikut di Vercel:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

4. Deploy.

## Struktur Folder Penting

- `app/page.tsx`: landing + feed curhat.
- `components/hub-client.tsx`: UI/logic client feed.
- `app/journal/page.tsx`: UI journal + sync key.
- `app/api/posts/route.ts`: list + create post.
- `app/api/posts/[id]/reaction/route.ts`: update reaction.
- `app/api/posts/[id]/report/route.ts`: report post.
- `app/api/journal/route.ts`: get/save journal cloud.
- `lib/supabase-admin.ts`: helper RPC Supabase.
- `lib/visitor-cookie.ts`: visitor cookie anonim.
- `lib/journal-types.ts`: tipe/validator journal.
- `docs/VERCEL_DATABASE_SETUP.md`: langkah setup DB.
- `docs/supabase-hub-schema.sql`: schema + function SQL.

## Catatan

- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server (API route), tidak diekspos ke client.
- Kalau sebelumnya sudah pakai schema lama, jalankan ulang `docs/supabase-hub-schema.sql` agar fungsi anti-spam + journal cloud aktif.
