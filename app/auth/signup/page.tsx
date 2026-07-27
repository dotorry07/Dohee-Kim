"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { signUp } from "@/lib/auth/client";
import { grades } from "@/lib/data";
import { validateSignup } from "@/lib/validators/auth";

interface DepartmentResponse {
  departments: string[];
  totalCount: number;
  filteredCount: number;
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [departmentQuery, setDepartmentQuery] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [grade, setGrade] = useState("");
  const [isDepartmentLoading, setIsDepartmentLoading] = useState(false);
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const departmentSearchRef = useRef<HTMLDivElement | null>(null);
  const matchingDepartments = useMemo(() => {
    const query = normalize(departmentQuery);

    if (!query) {
      return departments;
    }

    return departments.filter((item) => normalize(item).includes(query));
  }, [departmentQuery, departments]);
  const visibleDepartments = useMemo(() => matchingDepartments.slice(0, 30), [matchingDepartments]);
  const departmentSummary = useMemo(() => {
    if (isDepartmentLoading) {
      return "성신여대 학과 목록을 불러오는 중입니다.";
    }

    if (!normalize(departmentQuery)) {
      return `등록 학과 ${departments.length.toLocaleString("ko-KR")}개`;
    }

    const displayCount = visibleDepartments.length;
    const resultCount = matchingDepartments.length;
    return resultCount > displayCount
      ? `검색 결과 ${resultCount.toLocaleString("ko-KR")}개 · 상위 ${displayCount.toLocaleString("ko-KR")}개 표시`
      : `검색 결과 ${resultCount.toLocaleString("ko-KR")}개`;
  }, [departmentQuery, departments.length, isDepartmentLoading, matchingDepartments.length, visibleDepartments.length]);

  useEffect(() => {
    let isMounted = true;

    async function loadDepartments() {
      setIsDepartmentLoading(true);

      try {
        const response = await fetch("/api/sungshin-departments");

        if (!response.ok) {
          throw new Error("request failed");
        }

        const data = await response.json() as DepartmentResponse;

        if (isMounted) {
          setDepartments(data.departments);
          setError("");
        }
      } catch {
        if (isMounted) {
          setDepartments([]);
          setError("성신여대 학과 목록을 불러오지 못했습니다. 새로고침한 뒤 다시 시도해주세요.");
        }
      } finally {
        if (isMounted) {
          setIsDepartmentLoading(false);
        }
      }
    }

    loadDepartments();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function closeDropdown(event: globalThis.PointerEvent) {
      const target = event.target as Node;

      if (departmentSearchRef.current?.contains(target)) {
        return;
      }

      setIsDepartmentDropdownOpen(false);
    }

    document.addEventListener("pointerdown", closeDropdown);
    return () => document.removeEventListener("pointerdown", closeDropdown);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDepartmentLoading || !departments.length) {
      setError("성신여대 학과 목록을 불러온 뒤 다시 시도해주세요.");
      setSuccess("");
      return;
    }

    const validationError = validateSignup({ email, password, passwordConfirm, name, department, grade, availableDepartments: departments });
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
              <div className="dropdown-field" ref={departmentSearchRef}>
                <input
                  id="department"
                  value={departmentQuery}
                  placeholder="예: 컴퓨터공학과, AI융합학부"
                  autoComplete="off"
                  required
                  onFocus={() => setIsDepartmentDropdownOpen(true)}
                  onChange={(event) => {
                    setDepartmentQuery(event.target.value);
                    setDepartment("");
                    setIsDepartmentDropdownOpen(true);
                  }}
                />
                {isDepartmentDropdownOpen ? (
                  <div className="search-dropdown">
                    <div className="dropdown-summary">
                      {departmentSummary}
                    </div>
                    {visibleDepartments.map((item) => (
                      <button
                        className="dropdown-item dropdown-select-button"
                        key={item}
                        type="button"
                        onClick={() => {
                          setDepartment(item);
                          setDepartmentQuery(item);
                          setIsDepartmentDropdownOpen(false);
                        }}
                      >
                        <strong>{item}</strong>
                      </button>
                    ))}
                    {!isDepartmentLoading && !visibleDepartments.length ? (
                      <div className="dropdown-item">
                        <strong>일치하는 학과가 없습니다.</strong>
                        <span>학과명 일부를 다시 입력해주세요.</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="field">
              <label htmlFor="grade">학년</label>
              <select id="grade" value={grade} onChange={(event) => setGrade(event.target.value)} required>
                <option value="">학년을 선택해주세요</option>
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

function normalize(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}
