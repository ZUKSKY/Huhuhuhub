# HuhuhuHub Brand Guideline

## 1) Brand Positioning
- Brand name: `HuhuhuHub`
- Category: anonymous venting and emotional support space.
- Core promise: a playful and safe place to release frustration.
- Personality: cute, warm, non-judgmental, and expressive.

## 2) Tagline
- Primary: `Ngeluh dulu, lega kemudian.`
- Alternatives:
- `Curhat bebas, hati waras.`
- `Keluh kesah tanpa takut dihakimi.`

## 3) Audience
- Primary: Gen Z and young millennials (16-30).
- Behavior: active on short-form social platforms, prefers lightweight and expressive UI.

## 4) Visual Direction
- Design language: rounded, sticker-like, colorful, optimistic.
- UI shape: large radii (16px-28px), rounded bubbles, soft shadows.
- Motion:
- subtle card reveal on load.
- playful hover bounce for primary actions.
- floating sticker animation on hero.

## 5) Color Tokens
- `--coral-pop: #FF6B6B` (primary)
- `--sunny: #FFD166` (highlight)
- `--mint-calm: #7BDCB5` (calm state)
- `--sky-chill: #7BAAF7` (secondary accent)
- `--bg-cream: #FFF7F0` (base background)
- `--ink: #1E1E2E` (main text)

## 6) Typography
- Display: `Bricolage Grotesque`
- Body: `Space Grotesk`
- Tone: short sentence, conversational Indonesian, empathetic.

## 7) Logo System
- `public/logo-huhuhuhub.svg`: primary lockup (icon + wordmark + tagline).
- `app/icon.svg`: square app icon/favicon.
- Logo concept: chat bubble with soft-sad facial expression, representing emotional release.

## 8) Voice and Copy
- Use simple, human language.
- Avoid harsh wording and moralizing.
- Example lines:
- `Tumpahin unek-unek kamu.`
- `Dukungan cepat, tanpa drama.`
- `Belum ada curhat. Mau jadi yang pertama ngeluh hari ini?`

## 9) Safety Baseline
- Always show crisis reminder banner in public pages.
- Disallow personal data posts and abusive speech.
- Provide report action per post.

## 10) MVP Scope (Non-AI, Free-friendly)
- Anonymous posting.
- Mood tags.
- Support-only reactions.
- Report button.
- Private local journal.
- Community rules page.

## 11) Deployment
- Platform: Vercel Hobby.
- Runtime: Next.js App Router.
- Data mode for MVP: `localStorage` only (zero purchase needed).
