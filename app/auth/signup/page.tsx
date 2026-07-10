"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signUp } from "@/lib/auth/client";
import { departments, grades } from "@/lib/data";
import { validateSignup } from "@/lib/validators/auth";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState(departments[0]);
  const [grade, setGrade] = useState("1");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateSignup({ email, password, passwordConfirm, name, department, grade });
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    signUp({ email, name, department, grade: Number(grade) });
    setError("");
    setSuccess("회원가입이 완료되었습니다. 대시보드로 이동합니다.");
    window.setTimeout(() => {
      window.location.href = "/dashboard";
    }, 500);
  }

  return (
    <main className="page">
      <section className="page-header">
        <h1>회원가입</h1>
        <p>이름, 학과, 학년을 저장해 시간표 추천과 게시판 작성 권한에 활용합니다.</p>
      </section>
      <section className="panel">
        <form className="form" onSubmit={handleSubmit}>
          <div className="grid two">
            <div className="field">
              <label htmlFor="email">이메일</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="name">이름 또는 닉네임</label>
              <input id="name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password">비밀번호</label>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password-confirm">비밀번호 확인</label>
              <input id="password-confirm" type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="department">학과</label>
              <select id="department" value={department} onChange={(event) => setDepartment(event.target.value)}>
                {departments.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="grade">학년</label>
              <select id="grade" value={grade} onChange={(event) => setGrade(event.target.value)}>
                {grades.map((item) => <option key={item} value={item}>{item}학년</option>)}
              </select>
            </div>
          </div>
          {error ? <div className="error">{error}</div> : null}
          {success ? <div className="success">{success}</div> : null}
          <div className="chip-row">
            <button className="button" type="submit">가입하기</button>
            <Link className="ghost-button" href="/auth/login">로그인</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
