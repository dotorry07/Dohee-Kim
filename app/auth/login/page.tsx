"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "@/lib/auth/client";
import { validateLogin } from "@/lib/validators/auth";

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
    <main className="page">
      <section className="page-header">
        <h1>로그인</h1>
        <p>시연 계정은 freshman@sungshin.ac.kr / password123 입니다.</p>
      </section>
      <section className="panel">
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">비밀번호</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {error ? <div className="error">{error}</div> : null}
          <div className="chip-row">
            <button className="button" type="submit">로그인</button>
            <Link className="ghost-button" href="/auth/signup">회원가입</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
