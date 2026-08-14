"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth/client";
import type { UserProfile } from "@/lib/types";

type LoginRequiredIconName = "bell" | "bookmark" | "login" | "lock" | "user";

function LoginRequiredIcon({ name }: { name: LoginRequiredIconName }) {
  const paths = {
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.7 21a2 2 0 0 1-3.4 0" />,
    bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z" />,
    login: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="m10 17 5-5-5-5M15 12H3" /></>,
    lock: <><rect width="14" height="10" x="5" y="11" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3M12 15v2" /></>,
    user: <><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></>
  } satisfies Record<LoginRequiredIconName, React.ReactNode>;

  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

export function AuthGuard({ children }: { children: (user: UserProfile) => React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  if (user === undefined) {
    return <main className="page"><div className="panel">로그인 상태를 확인하는 중입니다.</div></main>;
  }

  if (!user) {
    return (
      <main className="login-required-page">
        <section className="login-required-card" aria-labelledby="login-required-title">
          <div className="login-required-icon-wrap" aria-hidden="true">
            <span className="login-required-icon">
              <LoginRequiredIcon name="lock" />
            </span>
          </div>
          <div className="login-required-content">
            <h1 id="login-required-title">로그인이 필요합니다</h1>
            <p>이 기능은 로그인 후 이용할 수 있습니다.</p>
            <ul className="login-required-benefits" aria-label="로그인 후 이용 가능한 기능">
              <li><LoginRequiredIcon name="user" />개인 맞춤 정보</li>
              <li><LoginRequiredIcon name="bell" />알림 및 공지 확인</li>
              <li><LoginRequiredIcon name="bookmark" />즐겨찾기 및 저장</li>
            </ul>
            <Link className="login-required-button" href="/auth/login">
              <LoginRequiredIcon name="login" />
              로그인으로 이동
            </Link>
          </div>
          <span className="login-required-orb" aria-hidden="true" />
          <span className="login-required-dot-grid" aria-hidden="true" />
          <span className="login-required-spark" aria-hidden="true" />
          <span className="login-required-rings" aria-hidden="true" />
        </section>
      </main>
    );
  }

  return <>{children(user)}</>;
}
