"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "@/lib/auth/client";
import type { UserProfile } from "@/lib/types";

export function AuthGuard({ children }: { children: (user: UserProfile) => React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  if (user === undefined) {
    return <main className="page"><div className="panel">로그인 상태를 확인하는 중입니다.</div></main>;
  }

  if (!user) {
    return (
      <main className="page">
        <section className="panel">
          <div className="section-title">
            <h1>로그인이 필요합니다</h1>
          </div>
          <p className="muted">이 기능은 로그인 후 사용할 수 있습니다.</p>
          <Link className="button" href="/auth/login">로그인으로 이동</Link>
        </section>
      </main>
    );
  }

  return <>{children(user)}</>;
}
