import { type NextRequest, NextResponse } from "next/server";
import { getAuthProvider } from "@/lib/auth/config";
import {
  authenticateMockUser,
  createMockSession,
  MOCK_ACCOUNTS_COOKIE,
  MOCK_SESSION_COOKIE,
  mockSessionCookieOptions
} from "@/lib/auth/mock-server";

type LoginRequest = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  if (getAuthProvider() !== "mock") {
    return NextResponse.json(
      { error: "Mock authentication is disabled.", reason: "mock_auth_disabled" },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => ({})) as LoginRequest;
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required.", reason: "missing_credentials" },
      { status: 400 }
    );
  }

  const user = authenticateMockUser(
    email,
    password,
    request.cookies.get(MOCK_ACCOUNTS_COOKIE)?.value
  );

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password.", reason: "invalid_credentials" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ user, provider: "mock" });
  response.cookies.set(MOCK_SESSION_COOKIE, createMockSession(user), mockSessionCookieOptions);
  return response;
}
