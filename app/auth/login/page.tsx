"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "@/lib/auth/client";
import { validateLogin } from "@/lib/validators/auth";

const benefits = [
  { icon: "calendar", title: "맞춤 시간표", description: "나에게 딱 맞는 시간표를 추천받아요" },
  { icon: "notice", title: "필독 공지", description: "놓치면 안 되는 공지를 확인해요" },
  { icon: "map", title: "캠퍼스 지도", description: "건물 정보와 길찾기를 한 눈에" },
  { icon: "board", title: "익명 게시판", description: "익명으로 자유롭게 소통해요" }
];

function BenefitIcon({ type }: { type: string }) {
  if (type === "calendar") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M8 3v4M16 3v4M4 10h16M8 14h3M13 14h3" />
      </svg>
    );
  }

  if (type === "notice") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    );
  }

  if (type === "map") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s7-5.4 7-12a7 7 0 0 0-14 0c0 6.6 7 12 7 12Z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("freshman@sungshin.ac.kr");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateLogin({ email, password });
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await signIn(email, password);
      window.location.href = "/dashboard";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="새내기 ON 소개">
        <div className="login-showcase-copy">
          <h1>
            새내기를 위한
            <strong>캠퍼스 도우미</strong>
          </h1>
          <p>시간표 추천, 필독 공지, 캠퍼스 지도와 커뮤니티까지<br />신입생에게 필요한 흐름을 한 곳에서 이어갑니다.</p>
        </div>

        <ul className="login-benefits" aria-label="주요 기능">
          {benefits.map((item) => (
            <li key={item.title}>
              <span className="login-benefit-icon">
                <BenefitIcon type={item.icon} />
              </span>
              <span className="login-benefit-copy">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-card">
          <div className="login-card-header">
            <h2 id="login-title">다시 오신 걸 환영해요</h2>
            <p>내 대시보드로 이어서 이동합니다.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email">이메일 주소</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </div>
            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="password">비밀번호</label>
                <Link href="/auth/signup">비밀번호 찾기</Link>
              </div>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            </div>
            {error ? <div className="error">{error}</div> : null}
            <button className="login-submit" type="submit">
              로그인
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="login-demo">시연 계정: freshman@sungshin.ac.kr / password123</p>
          <div className="login-signup">
            <span>계정이 없나요?</span>
            <Link href="/auth/signup">회원가입하기</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
