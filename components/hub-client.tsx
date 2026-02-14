"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isMood,
  moodValues,
  reactionValues,
  type FeedResponse,
  type Mood,
  type Post,
  type ReactionHistory,
  type ReactionKey,
  type ReportUsage,
} from "@/lib/hub-types";

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
  izin: `${icon.izin} Izin dulu`,
  random: `${icon.random} Random aja`,
};

const reactionLabel: Record<ReactionKey, string> = {
  hug: `${icon.hug} Peluk online`,
  semangat: `${icon.semangat} Semangatin`,
  gakSendiri: `${icon.gakSendiri} egiluy`,
  izin: `${icon.izin} Izin dulu`,
};

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };

    if (typeof body.error === "string" && body.error.length > 0) {
      return body.error;
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}

export function HubClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState("");
  const [mood, setMood] = useState<Mood>("random");
  const [reactedMap, setReactedMap] = useState<ReactionHistory>({});
  const [reportedMap, setReportedMap] = useState<ReportUsage>({});
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyPostMap, setBusyPostMap] = useState<Record<string, true>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalPosts = useMemo(() => posts.length, [posts]);

  const markPostBusy = (postId: string, isBusy: boolean): void => {
    setBusyPostMap((prev) => {
      if (isBusy) {
        return { ...prev, [postId]: true };
      }

      const next = { ...prev };
      delete next[postId];
      return next;
    });
  };

  const loadFeed = async (): Promise<void> => {
    setIsLoadingFeed(true);

    try {
      const response = await fetch("/api/posts", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Feed gagal dimuat."));
      }

      const payload = (await response.json()) as FeedResponse;

      setPosts(Array.isArray(payload.posts) ? payload.posts : []);
      setReactedMap(payload.reactedMap ?? {});
      setReportedMap(payload.reportedMap ?? {});
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Feed gagal dimuat.");
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    void loadFeed();
  }, []);

  const handleSubmit = async (): Promise<void> => {
    const cleanedText = text.trim();

    if (!cleanedText || isSubmitting || !isMood(mood)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanedText,
          mood,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Curhat gagal dikirim."));
      }

      const payload = (await response.json()) as { post: Post };

      setPosts((prev) => [payload.post, ...prev]);
      setText("");
      setMood("random");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Curhat gagal dikirim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (postId: string, reaction: ReactionKey): Promise<void> => {
    if (busyPostMap[postId]) return;

    const previous = reactedMap[postId];
    if (previous === reaction) return;

    markPostBusy(postId, true);

    try {
      const response = await fetch(`/api/posts/${postId}/reaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reaction }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Reaction belum masuk."));
      }

      const payload = (await response.json()) as {
        postId: string;
        selectedReaction: ReactionKey;
        reactions: Post["reactions"];
      };

      setReactedMap((prev) => ({
        ...prev,
        [payload.postId]: payload.selectedReaction,
      }));

      setPosts((prev) =>
        prev.map((post) =>
          post.id === payload.postId
            ? {
                ...post,
                reactions: payload.reactions,
              }
            : post,
        ),
      );

      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Reaction belum masuk.");
    } finally {
      markPostBusy(postId, false);
    }
  };

  const handleReport = async (postId: string): Promise<void> => {
    if (busyPostMap[postId] || reportedMap[postId]) return;

    markPostBusy(postId, true);

    try {
      const response = await fetch(`/api/posts/${postId}/report`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Laporan gagal dikirim."));
      }

      const payload = (await response.json()) as {
        postId: string;
        reported: boolean;
        reports: number;
      };

      if (payload.reported) {
        setReportedMap((prev) => ({ ...prev, [payload.postId]: true }));
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id === payload.postId
            ? {
                ...post,
                reports: payload.reports,
              }
            : post,
        ),
      );

      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Laporan gagal dikirim.");
    } finally {
      markPostBusy(postId, false);
    }
  };

  return (
    <section className="layout-grid layout-single">
      <div className="hub-stack">
        <div id="composer" className="panel composer-panel">
          <div className="panel-head">
            <p className="eyebrow">Mode anonim on {icon.write}</p>
            <h2 className="section-title">{icon.write} Tumpahin unek-unek, biar kepala enggak ngebul</h2>
          </div>

          <textarea
            className="composer-input"
            rows={5}
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={420}
            placeholder="Ceritain aja. Di sini aman, enggak ada sidang netizen."
          />

          <div className="mood-list">
            {moodValues.map((value) => (
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
            <button
              className="cta-button composer-submit"
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || text.trim().length === 0}
            >
              {isSubmitting ? `${icon.rocket} Lagi ngirim...` : `${icon.rocket} Lempar curhat`}
            </button>
          </div>
        </div>

        <div className="panel compact-info">
          <p className="eyebrow">Info singkat {icon.chart}</p>
          <p className="subtitle compact-copy">
            {totalPosts} curhat masuk hari ini. React sesukamu,
            kalau berubah pikiran tinggal ganti aja.
          </p>
          <p className="help-banner compact-help">
            {icon.support} Kalau lagi krisis, jangan dipendem sendiri. Langsung hubungi
            layanan darurat atau orang terdekat yang paling kamu percaya.
          </p>
          {errorMessage ? <p className="inline-error">{errorMessage}</p> : null}
        </div>

        <div className="panel feed-panel">
          <div className="panel-head">
            <p className="eyebrow">Feed drama warga {icon.feed}</p>
            <h2 className="section-title">{icon.megaphone} Cerita terbaru kaum pejuang</h2>
            <p className="subtitle">Baca, kasih react, lanjut healing tipis-tipis.</p>
          </div>

          <div className="feed">
            {isLoadingFeed ? <p className="empty">Lagi ngambil curhatan terbaru...</p> : null}

            {!isLoadingFeed &&
              posts.map((post) => {
                const reacted = reactedMap[post.id];
                const reported = Boolean(reportedMap[post.id]);
                const isBusy = Boolean(busyPostMap[post.id]);

                return (
                  <article key={post.id} className="post-card">
                    <div className="post-head">
                      <span className="meta-chip">{moodLabel[post.mood]}</span>
                      <span className="post-time">{formatTime(post.createdAt)}</span>
                    </div>

                    <p className="post-text">{post.text}</p>

                    <div className="reaction-list">
                      {reactionValues.map((reaction) => (
                        <button
                          key={reaction}
                          className={`reaction-button${reacted === reaction ? " is-selected" : ""}`}
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleReaction(post.id, reaction)}
                        >
                          {reactionLabel[reaction]} ({post.reactions[reaction]})
                        </button>
                      ))}
                      <button
                        className={`reaction-button${reported ? " is-selected" : ""}`}
                        type="button"
                        disabled={reported || isBusy}
                        onClick={() => handleReport(post.id)}
                      >
                        {icon.report} {reported ? "Udah dilapor" : "Laporin"} ({post.reports})
                      </button>
                    </div>
                  </article>
                );
              })}

            {!isLoadingFeed && posts.length === 0 ? (
              <p className="empty">Belum ada curhat. Mau jadi pembuka keluh kesah hari ini?</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
