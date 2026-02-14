import { NextRequest, NextResponse } from "next/server";
import { callSupabaseRpc } from "@/lib/supabase-admin";
import { attachVisitorCookie, readVisitor } from "@/lib/visitor-cookie";
import {
  isJournalDate,
  isOwnerKey,
  normalizeOwnerKey,
  type JournalEntry,
  type JournalResponse,
} from "@/lib/journal-types";

export const dynamic = "force-dynamic";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Terjadi kendala server.";
}

function toErrorStatus(message: string): number {
  const lowered = message.toLowerCase();

  if (lowered.includes("terlalu sering") || lowered.includes("rate limit")) {
    return 429;
  }

  return 500;
}

function resolveOwnerKey(rawSyncKey: string | null, visitorId: string): {
  ownerKey: string;
  usingSharedKey: boolean;
  error: string | null;
} {
  const cleaned = rawSyncKey ? normalizeOwnerKey(rawSyncKey) : "";

  if (!cleaned) {
    return {
      ownerKey: visitorId,
      usingSharedKey: false,
      error: null,
    };
  }

  if (!isOwnerKey(cleaned)) {
    return {
      ownerKey: visitorId,
      usingSharedKey: false,
      error: "Sync key tidak valid. Pakai 12-80 karakter huruf/angka/tanda -",
    };
  }

  return {
    ownerKey: cleaned,
    usingSharedKey: true,
    error: null,
  };
}

export async function GET(request: NextRequest) {
  const visitor = readVisitor(request);
  const owner = resolveOwnerKey(request.nextUrl.searchParams.get("syncKey"), visitor.visitorId);

  if (owner.error) {
    return NextResponse.json({ error: owner.error }, { status: 400 });
  }

  try {
    const rows = await callSupabaseRpc<JournalEntry[]>("hh_list_journal_entries", {
      p_owner_key: owner.ownerKey,
    });

    const responsePayload: JournalResponse = {
      ownerKey: owner.ownerKey,
      usingSharedKey: owner.usingSharedKey,
      entries: Array.isArray(rows) ? rows : [],
    };

    const response = NextResponse.json(responsePayload);
    attachVisitorCookie(response, visitor.visitorId, visitor.shouldSetCookie);

    return response;
  } catch (error) {
    const message = toErrorMessage(error);

    return NextResponse.json(
      { error: message },
      { status: toErrorStatus(message) },
    );
  }
}

export async function PUT(request: NextRequest) {
  const visitor = readVisitor(request);

  try {
    const body = (await request.json()) as {
      syncKey?: unknown;
      date?: unknown;
      text?: unknown;
    };

    const rawSyncKey = typeof body.syncKey === "string" ? body.syncKey : "";
    const owner = resolveOwnerKey(rawSyncKey, visitor.visitorId);

    if (owner.error) {
      return NextResponse.json({ error: owner.error }, { status: 400 });
    }

    if (!isJournalDate(body.date)) {
      return NextResponse.json(
        { error: "Tanggal jurnal tidak valid." },
        { status: 400 },
      );
    }

    if (typeof body.text !== "string") {
      return NextResponse.json(
        { error: "Isi jurnal tidak valid." },
        { status: 400 },
      );
    }

    const entry = await callSupabaseRpc<JournalEntry>("hh_upsert_journal_entry", {
      p_owner_key: owner.ownerKey,
      p_entry_date: body.date,
      p_content: body.text,
      p_visitor_id: visitor.visitorId,
    });

    const response = NextResponse.json({
      ownerKey: owner.ownerKey,
      usingSharedKey: owner.usingSharedKey,
      entry,
    });

    attachVisitorCookie(response, visitor.visitorId, visitor.shouldSetCookie);

    return response;
  } catch (error) {
    const message = toErrorMessage(error);

    return NextResponse.json(
      { error: message },
      { status: toErrorStatus(message) },
    );
  }
}
