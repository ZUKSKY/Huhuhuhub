const OWNER_KEY_REGEX = /^[A-Za-z0-9-]{12,80}$/;
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type JournalEntry = {
  date: string;
  text: string;
  updatedAt: number;
};

export type JournalResponse = {
  ownerKey: string;
  usingSharedKey: boolean;
  entries: JournalEntry[];
};

export function isOwnerKey(value: unknown): value is string {
  return typeof value === "string" && OWNER_KEY_REGEX.test(value);
}

export function normalizeOwnerKey(value: string): string {
  return value.trim();
}

export function isJournalDate(value: unknown): value is string {
  return typeof value === "string" && DATE_KEY_REGEX.test(value);
}
