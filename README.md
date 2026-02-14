# HuhuhuHub

HuhuhuHub adalah aplikasi curhat anonim berbasis Next.js dengan UI modern dan ringan.

## Fitur Utama

- Post curhat anonim dengan pilihan mood.
- Feed cerita dengan reaction.
- 1 user hanya punya 1 reaction aktif per post, tetapi bisa diganti kapan saja.
- Report per post dibatasi 1 kali per user.
- Private journal (hanya tersimpan di browser user).
- Halaman aturan komunitas.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- CSS custom (glassmorphism)
- Storage sementara: browser localStorage

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Build Production

```bash
npm run build
npm run start
```

Catatan: output build diarahkan ke `.next-build` melalui `next.config.ts`.

## Data Tersimpan di Mana

Aplikasi saat ini menyimpan data di browser (localStorage), bukan database server.

- `huhuhuhub.feed.v1`: daftar post + count reaction + count report.
- `huhuhuhub.feed.reactions.v1`: reaction aktif user per post.
- `huhuhuhub.feed.reports.v1`: status report user per post.
- `huhuhuhub.journal.v1`: isi private journal user.

Konsekuensi:

- Data tidak sinkron antar device/browser.
- Data hilang jika user clear site data.

## Struktur Folder Penting

- `app/page.tsx`: landing + feed curhat.
- `components/hub-client.tsx`: logic utama curhat, reaction, report.
- `app/journal/page.tsx`: private journal.
- `app/rules/page.tsx`: aturan komunitas.
- `app/globals.css`: styling global.
- `public/logo-huhuhuhub.svg`: logo utama.
- `app/icon.svg`: app icon.
- `brand-guideline.md`: guideline brand.

## Dokumen GitHub Push

Panduan push repo ada di:

- `docs/GITHUB_PUSH.md`

## Deploy ke Vercel

- Push repo ke GitHub.
- Import project ke Vercel.
- Framework preset: Next.js.
- Build command: default dari project (`npm run build`).
- Tidak butuh env khusus untuk MVP saat ini.

## Status MVP Saat Ini

- Siap demo dan deploy cepat.
- Belum pakai autentikasi.
- Belum pakai database backend.
