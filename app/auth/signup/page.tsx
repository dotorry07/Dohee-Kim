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

type FieldIconName = "mail" | "user" | "lock" | "book" | "building" | "plus";

const fieldIcons: Record<string, FieldIconName> = {
  email: "mail",
  name: "user",
  password: "lock",
  passwordConfirm: "lock",
  department: "building",
  secondaryDepartment: "plus",
  grade: "book"
};

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [departmentQuery, setDepartmentQuery] = useState("");
  const [secondaryDepartment, setSecondaryDepartment] = useState("");
  const [secondaryDepartmentQuery, setSecondaryDepartmentQuery] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [grade, setGrade] = useState("");
  const [isDepartmentLoading, setIsDepartmentLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDepartmentLoading || !departments.length) {
      setError("성신여대 학과 목록을 불러온 뒤 다시 시도해주세요.");
      setSuccess("");
      return;
    }

    const validationError = validateSignup({
      email,
      password,
      passwordConfirm,
      name,
      department,
      secondaryDepartment,
      grade,
      availableDepartments: departments
    });
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    signUp({ email, name, department, secondaryDepartment, grade: Number(grade) });
    setError("");
    setSuccess("회원가입이 완료되었습니다. 대시보드로 이동합니다.");
    window.setTimeout(() => {
      window.location.href = "/dashboard";
    }, 500);
  }

  return (
    <main className="signup-page">
      <section className="signup-hero">
        <div className="signup-hero-inner">
          <div>
            <span className="signup-eyebrow">회원가입</span>
            <h1>새내기 ON에 오신 것을 환영해요!</h1>
            <p>정확한 정보로 더 편리한 캠퍼스 생활을 시작해보세요.</p>
          </div>
          <img src="/images/timetable-banner-icon.png" alt="" aria-hidden="true" />
        </div>
      </section>

      <section className="signup-card" aria-labelledby="signup-title">
        <div className="signup-card-header">
          <h2 id="signup-title">필수 정보 입력</h2>
          <p>계정을 만들기 위한 정보를 입력해주세요.</p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="signup-fields">
            <div className="signup-field">
              <label htmlFor="email"><FieldIcon icon={fieldIcons.email} />이메일 주소</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="example@sungshin.ac.kr" />
            </div>
            <div className="signup-field">
              <label htmlFor="name"><FieldIcon icon={fieldIcons.name} />이름 또는 닉네임</label>
              <input id="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="이름 또는 닉네임을 입력해주세요" />
            </div>
            <div className="signup-field">
              <label htmlFor="password"><FieldIcon icon={fieldIcons.password} />비밀번호</label>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="영문, 숫자, 특수문자 포함 8자 이상" />
            </div>
            <div className="signup-field">
              <label htmlFor="password-confirm"><FieldIcon icon={fieldIcons.passwordConfirm} />비밀번호 확인</label>
              <input id="password-confirm" type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} autoComplete="new-password" placeholder="비밀번호를 다시 입력해주세요" />
            </div>
            <DepartmentCombobox
              id="department"
              label="학과"
              icon={fieldIcons.department}
              placeholder="학과를 선택해주세요"
              required
              selectedDepartment={department}
              query={departmentQuery}
              departments={departments}
              isLoading={isDepartmentLoading}
              onSelect={setDepartment}
              onQueryChange={setDepartmentQuery}
            />
            <div className="signup-field">
              <label htmlFor="grade"><FieldIcon icon={fieldIcons.grade} />학년도</label>
              <select id="grade" value={grade} onChange={(event) => setGrade(event.target.value)} required>
                <option value="">학년을 선택해주세요</option>
                {grades.map((item) => <option key={item} value={item}>{item}학년</option>)}
              </select>
            </div>
            <DepartmentCombobox
              id="secondary-department"
              label="부/복수전공"
              icon={fieldIcons.secondaryDepartment}
              placeholder="선택사항"
              selectedDepartment={secondaryDepartment}
              query={secondaryDepartmentQuery}
              departments={departments}
              isLoading={isDepartmentLoading}
              onSelect={setSecondaryDepartment}
              onQueryChange={setSecondaryDepartmentQuery}
            />
          </div>
          {error ? <div className="error">{error}</div> : null}
          {success ? <div className="success">{success}</div> : null}
          <button className="signup-submit" type="submit">회원가입 <span aria-hidden="true">→</span></button>
          <p className="signup-login">이미 계정이 있으신가요? <Link href="/auth/login">로그인하기</Link></p>
        </form>
      </section>
    </main>
  );
}

function FieldIcon({ icon }: { icon: FieldIconName }) {
  return (
    <span className="signup-field-icon" aria-hidden="true">
      {icon === "mail" ? (
        <svg viewBox="0 0 24 24">
          <path d="M4.5 6.5h15v11h-15z" />
          <path d="m5 7 7 6 7-6" />
        </svg>
      ) : null}
      {icon === "user" ? (
        <svg viewBox="0 0 24 24">
          <path d="M12 12.2a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Z" />
          <path d="M5.7 19.2c.8-3.2 3.1-5 6.3-5s5.5 1.8 6.3 5" />
        </svg>
      ) : null}
      {icon === "lock" ? (
        <svg viewBox="0 0 24 24">
          <path d="M6.5 10.5h11v9h-11z" />
          <path d="M8.8 10.5V8.3a3.2 3.2 0 0 1 6.4 0v2.2" />
          <path d="M12 14v2" />
        </svg>
      ) : null}
      {icon === "book" ? (
        <svg viewBox="0 0 24 24">
          <path d="M5 5.5h5.8c1.1 0 2 .9 2 2v11c0-1.1-.9-2-2-2H5z" />
          <path d="M19 5.5h-5.8c-1.1 0-2 .9-2 2v11c0-1.1.9-2 2-2H19z" />
          <path d="M12 7.5v11" />
        </svg>
      ) : null}
      {icon === "building" ? (
        <svg viewBox="0 0 24 24">
          <path d="M5.5 19.5h13" />
          <path d="M7 19.5v-12l5-2.5 5 2.5v12" />
          <path d="M10 10h.1M14 10h.1M10 13h.1M14 13h.1" />
        </svg>
      ) : null}
      {icon === "plus" ? (
        <svg viewBox="0 0 24 24">
          <path d="M12 5.5v13" />
          <path d="M5.5 12h13" />
        </svg>
      ) : null}
    </span>
  );
}

function DepartmentCombobox({
  id,
  label,
  icon,
  placeholder,
  required = false,
  selectedDepartment,
  query,
  departments,
  isLoading,
  onSelect,
  onQueryChange
}: {
  id: string;
  label: string;
  icon: FieldIconName;
  placeholder: string;
  required?: boolean;
  selectedDepartment: string;
  query: string;
  departments: string[];
  isLoading: boolean;
  onSelect: (value: string) => void;
  onQueryChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const matchingDepartments = useMemo(() => {
    const normalizedQuery = normalize(query);

    if (!normalizedQuery) {
      return departments;
    }

    return departments.filter((item) => normalize(item).includes(normalizedQuery));
  }, [departments, query]);
  const visibleDepartments = useMemo(() => matchingDepartments.slice(0, 30), [matchingDepartments]);
  const summary = useMemo(() => {
    if (isLoading) {
      return "성신여대 학과 목록을 불러오는 중입니다.";
    }

    if (!normalize(query)) {
      return `등록 학과 ${departments.length.toLocaleString("ko-KR")}개`;
    }

    const displayCount = visibleDepartments.length;
    const resultCount = matchingDepartments.length;
    return resultCount > displayCount
      ? `검색 결과 ${resultCount.toLocaleString("ko-KR")}개 · 상위 ${displayCount.toLocaleString("ko-KR")}개 표시`
      : `검색 결과 ${resultCount.toLocaleString("ko-KR")}개`;
  }, [departments.length, isLoading, matchingDepartments.length, query, visibleDepartments.length]);

  useEffect(() => {
    function closeDropdown(event: globalThis.PointerEvent) {
      const target = event.target as Node;

      if (searchRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeDropdown);
    return () => document.removeEventListener("pointerdown", closeDropdown);
  }, []);

  return (
    <div className="signup-field">
      <label htmlFor={id}><FieldIcon icon={icon} />{label}{required ? "" : " (선택)"}</label>
      <div className="dropdown-field" ref={searchRef}>
        <input
          id={id}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          required={required}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            onQueryChange(event.target.value);
            onSelect("");
            setIsOpen(true);
          }}
        />
        {isOpen ? (
          <div className="search-dropdown">
            <div className="dropdown-summary">{summary}</div>
            {!required && query ? (
              <button
                className="dropdown-item dropdown-select-button"
                type="button"
                onClick={() => {
                  onSelect("");
                  onQueryChange("");
                  setIsOpen(false);
                }}
              >
                <strong>선택 안 함</strong>
              </button>
            ) : null}
            {visibleDepartments.map((item) => (
              <button
                className={item === selectedDepartment ? "dropdown-item dropdown-select-button active" : "dropdown-item dropdown-select-button"}
                key={item}
                type="button"
                onClick={() => {
                  onSelect(item);
                  onQueryChange(item);
                  setIsOpen(false);
                }}
              >
                <strong>{item}</strong>
              </button>
            ))}
            {!isLoading && !visibleDepartments.length ? (
              <div className="dropdown-item">
                <strong>일치하는 학과가 없습니다.</strong>
                <span>학과명 일부를 다시 입력해주세요.</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function normalize(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}
