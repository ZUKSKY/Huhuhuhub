"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  isJournalDate,
  isOwnerKey,
  normalizeOwnerKey,
  type JournalEntry,
  type JournalResponse,
} from "@/lib/journal-types";

const SYNC_KEY_STORAGE = "huhuhuhub.journal.sync-key.v2";

const icon = {
  chat: "\u{1F4AC}",
  shield: "\u{1F6E1}\u{FE0F}",
  lock: "\u{1F512}",
  journal: "\u{1F4D4}",
  save: "\u{1F4BE}",
  key: "\u{1F511}",
  copy: "\u{1F4CB}",
};

type JournalEntriesMap = Record<string, string>;

function todayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function entriesToMap(entries: JournalEntry[]): JournalEntriesMap {
  return entries.reduce<JournalEntriesMap>((acc, item) => {
    if (isJournalDate(item.date)) {
      acc[item.date] = item.text;
    }

    return acc;
  }, {});
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };

    if (typeof body.error === "string" && body.error.length > 0) {
      return body.error;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export default function JournalPage() {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<JournalEntriesMap>({});
  const [syncKey, setSyncKey] = useState("");
  const [syncInput, setSyncInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const key = useMemo(() => todayKey(new Date()), []);

  const loadJournal = async (ownerKey: string): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/journal?syncKey=${encodeURIComponent(ownerKey)}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Jurnal gagal dimuat."));
      }

      const payload = (await response.json()) as JournalResponse;
      const nextMap = entriesToMap(payload.entries ?? []);

      setEntries(nextMap);
      setText(nextMap[key] ?? "");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Jurnal gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(SYNC_KEY_STORAGE);
    const cleaned = stored ? normalizeOwnerKey(stored) : "";
    const fallback = crypto.randomUUID();
    const nextKey = isOwnerKey(cleaned) ? cleaned : fallback;

    window.localStorage.setItem(SYNC_KEY_STORAGE, nextKey);
    setSyncKey(nextKey);
    setSyncInput(nextKey);
  }, []);

  useEffect(() => {
    if (!isOwnerKey(syncKey)) return;

    void loadJournal(syncKey);
  }, [syncKey]);

  useEffect(() => {
    if (isLoading) return;

    setText(entries[key] ?? "");
  }, [key, entries, isLoading]);

  const handleApplySyncKey = (): void => {
    const cleaned = normalizeOwnerKey(syncInput);

    if (!isOwnerKey(cleaned)) {
      setErrorMessage("Sync key tidak valid. Pakai 12-80 karakter huruf/angka/tanda -");
      return;
    }

    if (cleaned === syncKey) {
      setSuccessMessage("Sync key sudah aktif.");
      return;
    }

    window.localStorage.setItem(SYNC_KEY_STORAGE, cleaned);
    setSyncKey(cleaned);
    setSyncInput(cleaned);
    setSuccessMessage("Sync key aktif. Jurnal cloud sedang dimuat...");
    setErrorMessage(null);
  };

  const handleGenerateSyncKey = (): void => {
    const generated = crypto.randomUUID();
    window.localStorage.setItem(SYNC_KEY_STORAGE, generated);
    setSyncInput(generated);
    setSyncKey(generated);
    setSuccessMessage("Key baru dibuat. Simpan kalau mau dipakai di device lain.");
    setErrorMessage(null);
  };

  const handleCopySyncKey = async (): Promise<void> => {
    if (!syncKey) return;

    try {
      await navigator.clipboard.writeText(syncKey);
      setSuccessMessage("Sync key berhasil dicopy.");
      setErrorMessage(null);
    } catch {
      setErrorMessage("Gagal copy otomatis. Copy manual dari kolom sync key ya.");
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!isOwnerKey(syncKey) || isSaving) return;

    setIsSaving(true);

    try {
      const response = await fetch("/api/journal", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          syncKey,
          date: key,
          text,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Jurnal gagal disimpan."));
      }

      const payload = (await response.json()) as { entry: JournalEntry };
      const savedDate = payload.entry?.date;
      const savedText = payload.entry?.text ?? "";

      if (isJournalDate(savedDate)) {
        setEntries((prev) => {
          const next = { ...prev };

          if (savedText.trim().length === 0) {
            delete next[savedDate];
          } else {
            next[savedDate] = savedText;
          }

          return next;
        });
      }

      setText(savedText);
      setSuccessMessage(savedText.trim().length === 0 ? "Entry hari ini dihapus." : "Jurnal berhasil disimpan ke cloud.");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Jurnal gagal disimpan.");
    } finally {
      setIsSaving(false);
    }
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
          <Link href="/rules">{icon.shield} Aturan Main</Link>
        </nav>
      </header>

      <section className="panel journal-panel">
        <p className="eyebrow">Cloud journal {icon.lock}</p>
        <h1 className="section-title">{icon.journal} Jurnal Harian Pribadi</h1>
        <p className="subtitle">
          Tersimpan aman di database. Supaya sinkron antar device, pakai sync key yang sama.
        </p>

        <div className="journal-sync">
          <p className="sync-title">{icon.key} Sync key antar device</p>
          <p className="sync-note">
            Pakai kode yang sama di laptop/HP lain biar jurnal kamu kebaca di mana pun.
          </p>
          <div className="sync-controls">
            <input
              className="sync-input"
              type="text"
              value={syncInput}
              onChange={(event) => setSyncInput(event.target.value)}
              placeholder="Masukkan sync key"
              autoComplete="off"
              spellCheck={false}
            />
            <button className="reaction-button" type="button" onClick={handleApplySyncKey}>
              Pakai key
            </button>
            <button className="reaction-button" type="button" onClick={handleGenerateSyncKey}>
              Key baru
            </button>
            <button className="reaction-button" type="button" onClick={handleCopySyncKey}>
              {icon.copy} Copy
            </button>
          </div>
        </div>

        <textarea
          className="composer-input"
          rows={10}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={isLoading ? "Lagi memuat jurnal..." : "Tulis isi hati kamu di sini..."}
          maxLength={1500}
          disabled={isLoading}
        />

        <div className="composer-foot">
          <span className="char-counter">{text.length}/1500</span>
          <button className="cta-button journal-submit" type="button" onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? `${icon.save} Menyimpan...` : `${icon.save} Simpan jurnal`}
          </button>
        </div>

        {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}
        {successMessage ? <p className="inline-success">{successMessage}</p> : null}
      </section>
    </main>
  );
}
