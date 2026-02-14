import { NextRequest, NextResponse } from "next/server";
import { callSupabaseRpc } from "@/lib/supabase-admin";
import { attachVisitorCookie, readVisitor } from "@/lib/visitor-cookie";
import { isReactionKey, type ReactionCounts, type ReactionKey } from "@/lib/hub-types";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

type ReactionPayload = {
  postId: string;
  selectedReaction: ReactionKey;
  reactions: ReactionCounts;
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

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const postId = typeof params.id === "string" ? params.id : "";

  if (!postId) {
    return NextResponse.json(
      { error: "Post ID tidak valid." },
      { status: 400 },
    );
  }

  const visitor = readVisitor(request);

  try {
    const body = (await request.json()) as { reaction?: unknown };

    if (!isReactionKey(body.reaction)) {
      return NextResponse.json(
        { error: "Reaction tidak valid." },
        { status: 400 },
      );
    }

    const payload = await callSupabaseRpc<ReactionPayload>("hh_set_reaction", {
      p_post_id: postId,
      p_visitor_id: visitor.visitorId,
      p_reaction: body.reaction,
    });

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
