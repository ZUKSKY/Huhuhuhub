# GitHub Push Guide

Panduan ini untuk publish project HuhuhuHub ke GitHub.

## 1) Cek Status Repo

```bash
git status
git remote -v
```

## 2) Jika Belum Ada Repo Git Lokal

```bash
git init
git add .
git commit -m "chore: initial project commit"
git branch -M main
```

## 3) Hubungkan ke Repo GitHub

Ganti URL sesuai repo kamu:

```bash
git remote add origin https://github.com/<username>/<repo>.git
```

Jika remote `origin` sudah ada dan mau diganti:

```bash
git remote set-url origin https://github.com/<username>/<repo>.git
```

## 4) Push Pertama

```bash
git push -u origin main
```

## 5) Push Update Berikutnya

```bash
git add .
git commit -m "feat: update feature"
git push
```

## 6) Rekomendasi Commit Message

- `feat:` fitur baru
- `fix:` perbaikan bug
- `docs:` perubahan dokumentasi
- `style:` perubahan styling
- `refactor:` perapihan kode
- `chore:` pekerjaan maintenance

## 7) File Yang Tidak Ikut Ke Git

Project sudah mengabaikan file berikut lewat `.gitignore`:

- `node_modules`
- `.next`
- `.next-build*`
- `.vercel`
- file log
- file env lokal

## 8) Setelah Push

- Buat repo public/private sesuai kebutuhan.
- Tambahkan deskripsi repo dan topik.
- Hubungkan ke Vercel untuk auto deploy.
