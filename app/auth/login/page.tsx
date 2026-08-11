"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "@/lib/auth/client";
import { validateLogin } from "@/lib/validators/auth";

const benefits = ["맞춤 시간표", "필독 공지", "캠퍼스 지도", "익명 게시판"];

export default function LoginPage() {
  const [email, setEmail] = useState("freshman@sungshin.ac.kr");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateLogin({ email, password });
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      signIn(email, password);
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
          <p>시간표 추천, 필독 공지, 캠퍼스 지도와 커뮤니티까지 신입생에게 필요한 흐름을 한 곳에서 이어갑니다.</p>
        </div>

        <ul className="login-benefits" aria-label="주요 기능">
          {benefits.map((item) => <li key={item}>{item}</li>)}
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
            <label className="login-remember">
              <input type="checkbox" />
              <span>30일 동안 로그인 상태 유지</span>
            </label>
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
