import { type NextRequest, NextResponse } from "next/server";
import { getAuthProvider } from "@/lib/auth/config";
import { MOCK_SESSION_COOKIE, readMockSession } from "@/lib/auth/mock-server";

export function GET(request: NextRequest) {
  if (getAuthProvider() !== "mock") {
    return NextResponse.json(
      { user: null, error: "Mock authentication is disabled.", reason: "mock_auth_disabled" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const user = readMockSession(request.cookies.get(MOCK_SESSION_COOKIE)?.value);

  if (!user) {
    return NextResponse.json(
      { user: null, error: "Authentication required.", reason: "missing_session", provider: "mock" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { user, provider: "mock" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
