import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { demoUser } from "@/lib/auth/demo-user";
import type { UserProfile } from "@/lib/types";

export const MOCK_SESSION_COOKIE = "newbie-on-mock-session";
export const MOCK_ACCOUNTS_COOKIE = "newbie-on-mock-accounts";
export const MOCK_DEMO_PASSWORD = "password123";

const SESSION_TTL_SECONDS = 60 * 60 * 8;
const ACCOUNTS_TTL_SECONDS = 60 * 60 * 24 * 30;
const MAX_CUSTOM_ACCOUNTS = 5;
const FALLBACK_MOCK_SECRET = "newbie-on-development-mock-auth-v1";

type MockAccount = {
  email: string;
  passwordHash: string;
  user: UserProfile;
};

type SignedEnvelope<T> = {
  value: T;
  expiresAt: number;
};

type RegistrationInput = {
  email: string;
  password: string;
  user: UserProfile;
};

type RegistrationResult =
  | { user: UserProfile; accountsCookie: string }
  | { reason: "duplicate_email" | "invalid_email" | "missing_signup_input" | "weak_password" };

export const mockSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS
};

export const mockAccountsCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ACCOUNTS_TTL_SECONDS
};

export function authenticateMockUser(email: string, password: string, accountsCookie?: string) {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail === demoUser.email && password === MOCK_DEMO_PASSWORD) {
    return demoUser;
  }

  const account = readMockAccounts(accountsCookie)
    .find((candidate) => candidate.email === normalizedEmail);

  if (!account || !safeEqual(account.passwordHash, hashPassword(normalizedEmail, password))) {
    return null;
  }

  return account.user;
}

export function registerMockUser(input: RegistrationInput, accountsCookie?: string): RegistrationResult {
  const email = normalizeEmail(input.email);
  const password = input.password;
  const name = input.user?.name?.trim();
  const department = input.user?.department?.trim();

  if (!email || !password || !name || !department) {
    return { reason: "missing_signup_input" };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { reason: "invalid_email" };
  }

  if (password.length < 8) {
    return { reason: "weak_password" };
  }

  const accounts = readMockAccounts(accountsCookie);
  if (email === demoUser.email || accounts.some((account) => account.email === email)) {
    return { reason: "duplicate_email" };
  }

  const userId = randomUUID();
  const grade = input.user.grade;
  const user: UserProfile = {
    id: `mock-${userId}`,
    authUserId: `mock-auth-${userId}`,
    email,
    name,
    nickname: name,
    department,
    secondaryDepartment: input.user.secondaryDepartment?.trim() ?? "",
    studentNumber: input.user.studentNumber?.trim() ?? "",
    grade: grade === 1 || grade === 2 || grade === 3 || grade === 4 ? grade : 1,
    role: "user",
    createdAt: new Date().toISOString()
  };
  const nextAccounts = [
    ...accounts,
    { email, passwordHash: hashPassword(email, password), user }
  ].slice(-MAX_CUSTOM_ACCOUNTS);

  return {
    user,
    accountsCookie: signValue(nextAccounts, ACCOUNTS_TTL_SECONDS)
  };
}

export function createMockSession(user: UserProfile) {
  return signValue(user, SESSION_TTL_SECONDS);
}

export function readMockSession(sessionCookie?: string) {
  return readSignedValue<UserProfile>(sessionCookie);
}

function readMockAccounts(accountsCookie?: string) {
  const accounts = readSignedValue<MockAccount[]>(accountsCookie);
  return Array.isArray(accounts) ? accounts : [];
}

function signValue<T>(value: T, ttlSeconds: number) {
  const envelope: SignedEnvelope<T> = {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  };
  const encoded = Buffer.from(JSON.stringify(envelope)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function readSignedValue<T>(signedValue?: string) {
  if (!signedValue) return null;

  const separatorIndex = signedValue.lastIndexOf(".");
  if (separatorIndex <= 0) return null;

  const encoded = signedValue.slice(0, separatorIndex);
  const signature = signedValue.slice(separatorIndex + 1);
  if (!safeEqual(signature, sign(encoded))) return null;

  try {
    const envelope = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SignedEnvelope<T>;
    if (!envelope || typeof envelope.expiresAt !== "number" || envelope.expiresAt <= Date.now()) {
      return null;
    }
    return envelope.value;
  } catch {
    return null;
  }
}

function sign(value: string) {
  return createHmac("sha256", process.env.MOCK_AUTH_SECRET || FALLBACK_MOCK_SECRET)
    .update(value)
    .digest("base64url");
}

function hashPassword(email: string, password: string) {
  return createHash("sha256").update(`${email}\0${password}`).digest("base64url");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
