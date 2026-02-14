# Setup Database Gratis (Vercel + Supabase)

Dokumen ini untuk mengaktifkan penyimpanan feed + journal ke database Postgres (Supabase Free), lalu deploy di Vercel.

## Kenapa Pilihan Ini

- Tetap gratis untuk mulai (Supabase Free tier).
- Jalan normal di Vercel (tanpa server custom).
- Query utama pakai RPC supaya logic anti-spam dan validasi ada di server DB.

## 1) Buat Project Supabase

1. Buka https://supabase.com dan buat project baru (Free).
2. Tunggu database siap.
3. Buka menu `SQL Editor`.

## 2) Jalankan SQL Schema Terbaru

1. Buka file `docs/supabase-hub-schema.sql` dari repo ini.
2. Copy semua isi file.
3. Paste ke Supabase SQL Editor.
4. Jalankan query sampai sukses.

Schema ini mencakup:

- tabel feed (`hh_posts`, `hh_post_reactions`, `hh_post_reports`)
- tabel journal cloud (`hh_journal_entries`)
- tabel rate limit (`hh_rate_limits`)
- function RPC feed + journal
- anti-spam rate limit
- hardening security (RLS + revoke direct table access + grant execute hanya service role)

## 3) Ambil Environment Variable Supabase

Dari Supabase `Project Settings -> API` ambil:

- `Project URL` -> isi ke `SUPABASE_URL`
- `service_role` key -> isi ke `SUPABASE_SERVICE_ROLE_KEY`

## 4) Setup Env Lokal

Buat file `.env.local` di root project:

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Lalu jalankan:

```bash
npm run dev
```

## 5) Setup Env di Vercel

Di Vercel project settings -> Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Set untuk environment `Production`, `Preview`, `Development` (sesuai kebutuhan).

## 6) Deploy

- Push repo ke GitHub.
- Redeploy dari Vercel.

Setelah deploy:

- feed tersimpan di Supabase
- journal juga tersimpan di Supabase
- user bisa sinkron jurnal antar device pakai sync key yang sama

## 7) Cara Pakai Sinkron Journal

1. Buka halaman `Journal`.
2. Lihat kolom `Sync key antar device`.
3. Copy key itu ke device lain.
4. Di device lain, paste key yang sama lalu klik `Pakai key`.

Sekarang isi journal akan sinkron antar device tersebut.

## Catatan Penting

- `SUPABASE_SERVICE_ROLE_KEY` wajib hanya dipakai di server (API route), jangan dipakai di client component.
- Jika sebelumnya sudah pakai versi schema lama, jalankan ulang file SQL terbaru supaya fungsi baru aktif.

## Troubleshooting RPC

Kalau muncul error:

- `Could not find the function public.hh_list_posts(p_visitor_id) in the schema cache`

Lakukan ini di Supabase SQL Editor:

```sql
select n.nspname as schema_name,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname like 'hh_%'
order by p.proname;
```

Pastikan fungsi `hh_*` muncul lengkap. Jika belum, jalankan ulang file:

- `docs/supabase-hub-schema.sql`

Lalu refresh schema cache PostgREST:

```sql
notify pgrst, 'reload schema';
```

Checklist tambahan:

- `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` harus dari project Supabase yang sama.
- `public` harus ada di `Project Settings -> API -> Exposed schemas`.
- Restart dev server Next.js setelah ubah env.
