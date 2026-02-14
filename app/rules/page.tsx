import Link from "next/link";

const rules = [
  "Dukung, jangan menghakimi.",
  "Dilarang data pribadi: nomor HP, alamat, atau identitas orang.",
  "Tidak boleh ujaran kebencian, bullying, atau ancaman.",
  "Pakai komentar suportif dan empatik.",
  "Laporkan konten yang melanggar agar ruang tetap aman.",
];

const icon = {
  chat: "\u{1F4AC}",
  journal: "\u{1F4D4}",
  shield: "\u{1F6E1}\u{FE0F}",
  sos: "\u{1F198}",
};

export default function RulesPage() {
  return (
    <main className="main-shell">
      <header className="topbar">
        <Link href="/" className="brand-mark">
          <span className="brand-bubble">uhu</span>
          <span className="brand-name">HuhuhuHub</span>
        </Link>
        <nav className="topnav">
          <Link href="/">{icon.chat} Ruang Curhat</Link>
          <Link href="/journal">{icon.journal} Journal</Link>
        </nav>
      </header>

      <section className="panel">
        <p className="eyebrow">Safe space rules {icon.shield}</p>
        <h1 className="section-title">{icon.shield} Aturan Komunitas HuhuhuHub</h1>
        <ul className="rules-list">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className="help-banner">
          {icon.sos} Jika kamu merasa dalam krisis atau bahaya, segera hubungi layanan
          darurat setempat atau orang terdekat yang kamu percaya.
        </p>
      </section>
    </main>
  );
}
