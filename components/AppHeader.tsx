"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, signOut } from "@/lib/auth/client";

const links = [
  ["새내기 필독", "/must-read"],
  ["대시보드", "/dashboard"],
  ["시간표", "/timetable"],
  ["지도", "/map"],
  ["게시판", "/board"],
  ["강의평", "/reviews"],
  ["공지", "/notices"]
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    setUserName(getStoredUser()?.name ?? "");
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            <img src="/images/app-logo-header.png" alt="" width={36} height={36} />
          </span>
          <span>새내기 ON</span>
        </Link>
        <nav className="nav" aria-label="주요 메뉴">
          {links.map(([label, href]) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link className={isActive ? "active" : undefined} key={href} href={href} aria-current={isActive ? "page" : undefined}>
                {label}
              </Link>
            );
          })}
          {userName ? (
            <button
              type="button"
              onClick={() => {
                signOut();
                setUserName("");
                window.location.href = "/";
              }}
            >
              로그아웃
            </button>
          ) : (
            <Link href="/auth/login">로그인</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
