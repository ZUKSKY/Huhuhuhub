import Link from "next/link";
import { HubClient } from "@/components/hub-client";

const icon = {
  journal: "\u{1F4D4}",
  shield: "\u{1F6E1}\u{FE0F}",
  sparkle: "\u2728",
  heart: "\u{1F499}",
  rainbow: "\u{1F308}",
  write: "\u{1F4DD}",
  sticker: "\u{1F62D}\u{1F499}",
};

export default function Home() {
  return (
    <main className="main-shell">
      <header className="topbar">
        <Link href="/" className="brand-mark" aria-label="HuhuhuHub home">
          <span className="brand-bubble">uhu</span>
          <span className="brand-name">HuhuhuHub</span>
        </Link>

        <nav className="topnav">
          <Link href="/journal">{icon.journal} Journal</Link>
          <Link href="/rules">{icon.shield} Rules</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Anonymous vent space {icon.sparkle}</p>
          <h1>{icon.heart} Tempat aman buat bilang, "hari ini ngeselin banget."</h1>
          <p className="subtitle">
            Curhat anonim, dapat dukungan, lalu lanjut hidup pelan-pelan.
            Ngeluh dulu, lega kemudian
          </p>
          <a href="#composer" className="cta-button">
            {icon.write} Tumpahin unek-unek
          </a>
        </div>
        <div className="hero-sticker" aria-hidden="true">
          <p>{icon.sticker}</p>
        </div>
      </section>

      <HubClient />
    </main>
  );
}
