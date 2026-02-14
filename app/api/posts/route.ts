import { NextRequest, NextResponse } from "next/server";
import { callSupabaseRpc } from "@/lib/supabase-admin";
import { attachVisitorCookie, readVisitor } from "@/lib/visitor-cookie";
import {
  isMood,
  isReactionKey,
  type FeedResponse,
  type Post,
  type ReactionCounts,
  type ReactionHistory,
  type ReportUsage,
} from "@/lib/hub-types";

export const dynamic = "force-dynamic";

type FeedPostRow = Post & {
  myReaction: string | null;
  myReported: boolean;
};

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

function sanitizeCounts(input: unknown): ReactionCounts {
  const source = (input ?? {}) as Partial<Record<keyof ReactionCounts, unknown>>;

  return {
    hug: Number(source.hug ?? 0),
    semangat: Number(source.semangat ?? 0),
    gakSendiri: Number(source.gakSendiri ?? 0),
    izin: Number(source.izin ?? 0),
  };
}

function toFeedResponse(rows: FeedPostRow[]): FeedResponse {
  const reactedMap: ReactionHistory = {};
  const reportedMap: ReportUsage = {};

  const posts = rows.map((row) => {
    if (row.myReaction && isReactionKey(row.myReaction)) {
      reactedMap[row.id] = row.myReaction;
    }

    if (row.myReported) {
      reportedMap[row.id] = true;
    }

    return {
      id: row.id,
      text: row.text,
      mood: row.mood,
      createdAt: Number(row.createdAt),
      reports: Number(row.reports),
      reactions: sanitizeCounts(row.reactions),
    };
  });

  return {
    posts,
    reactedMap,
    reportedMap,
  };
}

export async function GET(request: NextRequest) {
  const visitor = readVisitor(request);

  try {
    const rows = await callSupabaseRpc<FeedPostRow[]>("hh_list_posts", {
      p_visitor_id: visitor.visitorId,
    });

    const payload = toFeedResponse(Array.isArray(rows) ? rows : []);
    const response = NextResponse.json(payload);

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

export async function POST(request: NextRequest) {
  const visitor = readVisitor(request);

  try {
    const body = (await request.json()) as {
      text?: unknown;
      mood?: unknown;
    };

    const cleanedText = typeof body.text === "string" ? body.text.trim() : "";

    if (cleanedText.length === 0) {
      return NextResponse.json(
        { error: "Isi curhat dulu ya." },
        { status: 400 },
      );
    }

    if (cleanedText.length > 420) {
      return NextResponse.json(
        { error: "Maksimal 420 karakter." },
        { status: 400 },
      );
    }

    if (!isMood(body.mood)) {
      return NextResponse.json(
        { error: "Mood tidak valid." },
        { status: 400 },
      );
    }

    const post = await callSupabaseRpc<Post>("hh_create_post", {
      p_content: cleanedText,
      p_mood: body.mood,
      p_visitor_id: visitor.visitorId,
    });

    const response = NextResponse.json({ post }, { status: 201 });
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
