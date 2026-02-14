export const moodValues = ["capek", "kesel", "cemas", "sedih", "izin", "random"] as const;

export type Mood = (typeof moodValues)[number];

export const reactionValues = ["hug", "semangat", "gakSendiri", "izin"] as const;

export type ReactionKey = (typeof reactionValues)[number];

export type ReactionCounts = Record<ReactionKey, number>;

export type Post = {
  id: string;
  text: string;
  mood: Mood;
  createdAt: number;
  reports: number;
  reactions: ReactionCounts;
};

export type ReactionHistory = Record<string, ReactionKey>;
export type ReportUsage = Record<string, true>;

export type FeedResponse = {
  posts: Post[];
  reactedMap: ReactionHistory;
  reportedMap: ReportUsage;
};

export function createEmptyReactions(): ReactionCounts {
  return {
    hug: 0,
    semangat: 0,
    gakSendiri: 0,
    izin: 0,
  };
}

export function isMood(value: unknown): value is Mood {
  return typeof value === "string" && moodValues.includes(value as Mood);
}

export function isReactionKey(value: unknown): value is ReactionKey {
  return typeof value === "string" && reactionValues.includes(value as ReactionKey);
}
