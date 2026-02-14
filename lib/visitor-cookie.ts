import { NextRequest, NextResponse } from "next/server";

const VISITOR_COOKIE = "huhuhuhub_visitor_id";
const VISITOR_ID_REGEX = /^[a-zA-Z0-9-]{12,80}$/;
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

type VisitorInfo = {
  visitorId: string;
  shouldSetCookie: boolean;
};

export function readVisitor(request: NextRequest): VisitorInfo {
  const existing = request.cookies.get(VISITOR_COOKIE)?.value;

  if (existing && VISITOR_ID_REGEX.test(existing)) {
    return {
      visitorId: existing,
      shouldSetCookie: false,
    };
  }

  return {
    visitorId: crypto.randomUUID(),
    shouldSetCookie: true,
  };
}

export function attachVisitorCookie(
  response: NextResponse,
  visitorId: string,
  shouldSetCookie: boolean,
): void {
  if (!shouldSetCookie) return;

  response.cookies.set({
    name: VISITOR_COOKIE,
    value: visitorId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}
