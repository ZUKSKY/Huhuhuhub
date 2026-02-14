"use client";

import { useEffect, useMemo, useState } from "react";

type Mood = "capek" | "kesel" | "cemas" | "sedih" | "izin" | "random";

type ReactionKey = "hug" | "semangat" | "gakSendiri" | "izin";

type Post = {
  id: string;
  text: string;
  mood: Mood;
  createdAt: number;
  reports: number;
  reactions: Record<ReactionKey, number>;
};

type StoredPost = Omit<Post, "reactions"> & {
  reactions?: Partial<Record<ReactionKey, number>>;
};

type ReactionHistory = Record<string, ReactionKey>;
type ReportUsage = Record<string, true>;

const STORAGE_KEY = "huhuhuhub.feed.v1";
const REACTION_STORAGE_KEY = "huhuhuhub.feed.reactions.v1";
const REPORT_STORAGE_KEY = "huhuhuhub.feed.reports.v1";

const reactionKeys: ReactionKey[] = ["hug", "semangat", "gakSendiri", "izin"];

const icon = {
  capek: "\u{1F62E}",
  kesel: "\u{1F624}",
  cemas: "\u{1F630}",
  sedih: "\u{1F622}",
  izin: "\u{1F64F}",
  random: "\u{1F3B2}",
  hug: "\u{1F917}",
  semangat: "\u{1F4AA}",
  gakSendiri: "\u{1F632}",
  write: "\u270D\u{FE0F}",
  rocket: "\u{1F680}",
  feed: "\u{1F4AC}",
  megaphone: "\u{1F4E2}",
  report: "\u{1F6A9}",
  chart: "\u{1F4CA}",
  support: "\u{1F91D}",
};

const moodLabel: Record<Mood, string> = {
  capek: `${icon.capek} Capek`,
  kesel: `${icon.kesel} Kesel`,
  cemas: `${icon.cemas} Cemas`,
  sedih: `${icon.sedih} Sedih`,
  izin: `${icon.izin} Izin`,
  random: `${icon.random} Random`,
};

const reactionLabel: Record<ReactionKey, string> = {
  hug: `${icon.hug} Peluk virtual`,
  semangat: `${icon.semangat} Semangat`,
  gakSendiri: `${icon.gakSendiri} egiluy`,
  izin: `${icon.izin} Izin`,
};

const defaultPosts: Post[] = [
  {
    id: "seed-1",
    text: "Kerjaan numpuk, laptop lemot, hujan deras. Paket kombo hari ini.",
    mood: "capek",
    createdAt: Date.now() - 1000 * 60 * 47,
    reports: 0,
    reactions: { hug: 12, semangat: 4, gakSendiri: 8, izin: 3 },
  },
  {
    id: "seed-2",
    text: "Udah effort banget, tapi masih dibilang kurang. Boleh nangis tipis dulu ga?",
    mood: "sedih",
    createdAt: Date.now() - 1000 * 60 * 122,
    reports: 0,
    reactions: { hug: 20, semangat: 15, gakSendiri: 18, izin: 5 },
  },
];

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function normalizePost(post: StoredPost): Post {
  return {
    ...post,
    reactions: {
      hug: Number(post.reactions?.hug ?? 0),
      semangat: Number(post.reactions?.semangat ?? 0),
      gakSendiri: Number(post.reactions?.gakSendiri ?? 0),
      izin: Number(post.reactions?.izin ?? 0),
    },
  };
}

function isReactionKey(value: unknown): value is ReactionKey {
  return typeof value === "string" && reactionKeys.includes(value as ReactionKey);
}

function normalizeReactionHistory(raw: unknown): ReactionHistory {
  if (!raw || typeof raw !== "object") return {};

  const source = raw as Record<string, unknown>;
  const normalized: ReactionHistory = {};

  Object.entries(source).forEach(([postId, entry]) => {
    if (isReactionKey(entry)) {
      normalized[postId] = entry;
      return;
    }

    if (!entry || typeof entry !== "object") return;

    const flags = entry as Record<string, unknown>;
    const picked = reactionKeys.find((key) => Boolean(flags[key]));

    if (picked) {
      normalized[postId] = picked;
    }
  });

  return normalized;
}

function normalizeReportUsage(raw: unknown): ReportUsage {
  if (!raw || typeof raw !== "object") return {};

  const source = raw as Record<string, unknown>;
  const normalized: ReportUsage = {};

  Object.entries(source).forEach(([postId, value]) => {
    if (Boolean(value)) {
      normalized[postId] = true;
    }
  });

  return normalized;
}

export function HubClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [mood, setMood] = useState<Mood>("random");
  const [reactedMap, setReactedMap] = useState<ReactionHistory>({});
  const [reportedMap, setReportedMap] = useState<ReportUsage>({});

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const rawReactions = window.localStorage.getItem(REACTION_STORAGE_KEY);
    const rawReports = window.localStorage.getItem(REPORT_STORAGE_KEY);

    if (rawReactions) {
      try {
        setReactedMap(normalizeReactionHistory(JSON.parse(rawReactions)));
      } catch {
        setReactedMap({});
      }
    }

    if (rawReports) {
      try {
        setReportedMap(normalizeReportUsage(JSON.parse(rawReports)));
      } catch {
        setReportedMap({});
      }
    }

    if (!raw) {
      setPosts(defaultPosts);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPosts));
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredPost[];
      const safePosts = parsed.map(normalizePost);
      setPosts(safePosts.length > 0 ? safePosts : defaultPosts);
    } catch {
      setPosts(defaultPosts);
    }
  }, []);

  useEffect(() => {
    if (posts.length === 0) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    window.localStorage.setItem(REACTION_STORAGE_KEY, JSON.stringify(reactedMap));
  }, [reactedMap]);

  useEffect(() => {
    window.localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reportedMap));
  }, [reportedMap]);

  const totalPosts = useMemo(() => posts.length, [posts]);

  const handleSubmit = (): void => {
    const cleaned = text.trim();
    if (!cleaned) return;

    const nextPost: Post = {
      id: crypto.randomUUID(),
      text: cleaned,
      mood,
      createdAt: Date.now(),
      reports: 0,
      reactions: { hug: 0, semangat: 0, gakSendiri: 0, izin: 0 },
    };

    setPosts((prev) => [nextPost, ...prev]);
    setText("");
    setMood("random");
  };

  const handleReaction = (postId: string, reaction: ReactionKey): void => {
    const previous = reactedMap[postId];
    if (previous === reaction) return;

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;

        const nextReactions = { ...post.reactions };

        if (previous) {
          nextReactions[previous] = Math.max(0, nextReactions[previous] - 1);
        }

        nextReactions[reaction] = nextReactions[reaction] + 1;

        return {
          ...post,
          reactions: nextReactions,
        };
      }),
    );

    setReactedMap((prev) => ({ ...prev, [postId]: reaction }));
  };

  const handleReport = (postId: string): void => {
    if (reportedMap[postId]) return;

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, reports: post.reports + 1 } : post,
      ),
    );

    setReportedMap((prev) => ({ ...prev, [postId]: true }));
  };

  return (
    <section className="layout-grid layout-single">
      <div className="hub-stack">
        <div id="composer" className="panel composer-panel">
          <div className="panel-head">
            <p className="eyebrow">Anonymous post {icon.write}</p>
            <h2 className="section-title">{icon.write} Tumpahin unek-unek kamu</h2>
          </div>

          <textarea
            className="composer-input"
            rows={5}
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={420}
            placeholder="Ceritain aja. Tidak ada nama, tidak ada penghakiman."
          />

          <div className="mood-list">
            {(Object.keys(moodLabel) as Mood[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`mood-chip${value === mood ? " active" : ""}`}
                onClick={() => setMood(value)}
              >
                {moodLabel[value]}
              </button>
            ))}
          </div>

          <div className="composer-foot">
            <span className="char-counter">{text.length}/420</span>
            <button className="cta-button composer-submit" type="button" onClick={handleSubmit}>
              {icon.rocket} Kirim curhat
            </button>
          </div>
        </div>

        <div className="panel compact-info">
          <p className="eyebrow">Info singkat {icon.chart}</p>
          <p className="subtitle compact-copy">
            {totalPosts} curhat hari ini. Kamu punya 1 reaction aktif per cerita,
            tapi bisa diganti kapan saja.
          </p>
          <p className="help-banner compact-help">
            {icon.support} Jika lagi krisis, langsung hubungi layanan darurat atau
            orang terdekat yang kamu percaya.
          </p>
        </div>

        <div className="panel feed-panel">
          <div className="panel-head">
            <p className="eyebrow">Feed cerita {icon.feed}</p>
            <h2 className="section-title">{icon.megaphone} Cerita terbaru</h2>
            <p className="subtitle">Dukungan cepat, tanpa drama.</p>
          </div>

          <div className="feed">
            {posts.map((post) => {
              const reacted = reactedMap[post.id];
              const reported = Boolean(reportedMap[post.id]);

              return (
                <article key={post.id} className="post-card">
                  <div className="post-head">
                    <span className="meta-chip">{moodLabel[post.mood]}</span>
                    <span className="post-time">{formatTime(post.createdAt)}</span>
                  </div>

                  <p className="post-text">{post.text}</p>

                  <div className="reaction-list">
                    {reactionKeys.map((reaction) => (
                      <button
                        key={reaction}
                        className={`reaction-button${reacted === reaction ? " is-selected" : ""}`}
                        type="button"
                        onClick={() => handleReaction(post.id, reaction)}
                      >
                        {reactionLabel[reaction]} ({post.reactions[reaction]})
                      </button>
                    ))}
                    <button
                      className={`reaction-button${reported ? " is-selected" : ""}`}
                      type="button"
                      disabled={reported}
                      onClick={() => handleReport(post.id)}
                    >
                      {icon.report} {reported ? "Reported" : "Report"} ({post.reports})
                    </button>
                  </div>
                </article>
              );
            })}
            {posts.length === 0 ? (
              <p className="empty">
                Belum ada curhat. Mau jadi yang pertama ngeluh hari ini?
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
