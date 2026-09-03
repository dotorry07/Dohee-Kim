import { NextResponse } from "next/server";
import { getAuthProvider } from "@/lib/auth/config";
import { MOCK_SESSION_COOKIE, mockSessionCookieOptions } from "@/lib/auth/mock-server";

export function POST() {
  if (getAuthProvider() !== "mock") {
    return NextResponse.json(
      { error: "Mock authentication is disabled.", reason: "mock_auth_disabled" },
      { status: 404 }
    );
  }

  const response = NextResponse.json({ success: true, provider: "mock" });
  response.cookies.set(MOCK_SESSION_COOKIE, "", {
    ...mockSessionCookieOptions,
    maxAge: 0
  });
  return response;
}
