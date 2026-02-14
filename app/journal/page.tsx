"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "huhuhuhub.journal.v1";

const icon = {
  chat: "\u{1F4AC}",
  shield: "\u{1F6E1}\u{FE0F}",
  lock: "\u{1F512}",
  journal: "\u{1F4D4}",
  save: "\u{1F4BE}",
};

function todayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function JournalPage() {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<Record<string, string>>({});
  const key = useMemo(() => todayKey(new Date()), []);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      setEntries(parsed);
      setText(parsed[key] ?? "");
    } catch {
      setEntries({});
    }
  }, [key]);

  const handleSave = (): void => {
    const next = { ...entries, [key]: text.trim() };
    setEntries(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <main className="main-shell">
      <header className="topbar">
        <Link href="/" className="brand-mark">
          <span className="brand-bubble">uhu</span>
          <span className="brand-name">HuhuhuHub</span>
        </Link>
        <nav className="topnav">
          <Link href="/">{icon.chat} Ruang Curhat</Link>
          <Link href="/rules">{icon.shield} Rules</Link>
        </nav>
      </header>

      <section className="panel">
        <p className="eyebrow">Private only {icon.lock}</p>
        <h1 className="section-title">{icon.journal} Jurnal Harian Pribadi</h1>
        <p className="subtitle">
          Hanya tersimpan di browser kamu. Tidak muncul di feed publik.
        </p>

        <textarea
          className="composer-input"
          rows={10}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Tulis isi hati kamu di sini..."
          maxLength={1500}
        />

        <div className="composer-foot">
          <span className="char-counter">{text.length}/1500</span>
          <button className="cta-button" type="button" onClick={handleSave}>
            {icon.save} Simpan jurnal
          </button>
        </div>
      </section>
    </main>
  );
}
