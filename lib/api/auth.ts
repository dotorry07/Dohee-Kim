import type { UserProfile } from "@/lib/types";

type MockAuthResponse = {
  user?: UserProfile | null;
  error?: string;
  reason?: string;
};

export async function loginWithMockApi(email: string, password: string) {
  const { response, body } = await requestMockAuth("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    if (body.reason === "invalid_credentials") {
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    if (body.reason === "missing_credentials") {
      throw new Error("이메일과 비밀번호를 모두 입력해주세요.");
    }

    throw new Error(body.error || "로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
  }

  if (!body.user) {
    throw new Error("로그인 API 응답에 사용자 정보가 없습니다.");
  }

  return body.user;
}

export async function getMockCurrentUser() {
  const { response, body } = await requestMockAuth("/api/auth/me", {
    method: "GET",
    cache: "no-store"
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error("로그인 상태를 확인하지 못했습니다.");
  }

  return body.user ?? null;
}

export async function logoutFromMockApi() {
  const { response } = await requestMockAuth("/api/auth/logout", { method: "POST" });
  if (!response.ok) {
    throw new Error("로그아웃 요청을 완료하지 못했습니다.");
  }
}

export async function signupWithMockApi(input: {
  email: string;
  password: string;
  user: UserProfile;
}) {
  const { response, body } = await requestMockAuth("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    if (body.reason === "duplicate_email") {
      throw new Error("이미 가입된 이메일입니다. 로그인 화면에서 로그인해주세요.");
    }
    if (body.reason === "invalid_email") {
      throw new Error("사용할 수 없는 이메일 주소입니다.");
    }
    if (body.reason === "weak_password") {
      throw new Error("비밀번호는 8자 이상이어야 합니다.");
    }
    throw new Error("회원가입에 필요한 정보를 확인해주세요.");
  }

  if (!body.user) {
    throw new Error("회원가입 API 응답에 사용자 정보가 없습니다.");
  }

  return body.user;
}

async function requestMockAuth(path: string, init: RequestInit) {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...init.headers
      }
    });
  } catch {
    throw new Error("인증 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.");
  }

  const body = await response.json().catch(() => ({})) as MockAuthResponse;
  return { response, body };
}
