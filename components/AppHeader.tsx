"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredUser, signOut } from "@/lib/auth/client";

const links = [
  ["새내기 필독", "/must-read"],
  ["대시보드", "/dashboard"],
  ["시간표", "/timetable"],
  ["지도", "/map"],
  ["게시판", "/board"],
  ["공지", "/notices"]
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>("");
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });
  const activeLink = links.find(([, href]) => pathname === href || pathname.startsWith(`${href}/`));

  const updateIndicator = useCallback(() => {
    const nav = navRef.current;
    const activeHref = activeLink?.[1];
    const activeElement = activeHref ? linkRefs.current.get(activeHref) : null;

    if (!nav || !activeElement) {
      setIndicator((current) => ({ ...current, visible: false }));
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const activeRect = activeElement.getBoundingClientRect();
    setIndicator({
      left: activeRect.left - navRect.left + nav.scrollLeft,
      width: activeRect.width,
      visible: true
    });
  }, [activeLink]);

  useEffect(() => {
    setUserName(getStoredUser()?.name ?? "");
  }, []);

  useEffect(() => {
    updateIndicator();
    const nav = navRef.current;
    window.addEventListener("resize", updateIndicator);
    nav?.addEventListener("scroll", updateIndicator, { passive: true });
    return () => {
      window.removeEventListener("resize", updateIndicator);
      nav?.removeEventListener("scroll", updateIndicator);
    };
  }, [updateIndicator]);

  const handleLogout = () => {
    signOut();
    setUserName("");
    setIsLogoutConfirmOpen(false);
    window.location.href = "/";
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              <img src="/images/app-logo-header.png" alt="" width={36} height={36} />
            </span>
            <span>새내기 ON</span>
          </Link>
          <nav className="nav" aria-label="주요 메뉴" ref={navRef}>
            <span
              className={indicator.visible ? "nav-active-indicator visible" : "nav-active-indicator"}
              style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
              aria-hidden="true"
            />
            {links.map(([label, href]) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Link
                  className={isActive ? "active" : undefined}
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  ref={(element) => {
                    if (element) {
                      linkRefs.current.set(href, element);
                    } else {
                      linkRefs.current.delete(href);
                    }
                  }}
                >
                  {label}
                </Link>
              );
            })}
            {userName ? (
              <span className="nav-auth-actions">
                <button className="auth-button logout-auth-button" type="button" onClick={() => setIsLogoutConfirmOpen(true)}>
                  로그아웃
                </button>
                <Link className={pathname.startsWith("/mypage") ? "auth-button active" : "auth-button"} href="/mypage">
                  마이페이지
                </Link>
              </span>
            ) : (
              <span className="nav-auth-actions">
                <Link className="auth-button" href="/auth/login">로그인</Link>
              </span>
            )}
          </nav>
        </div>
      </header>
      {isLogoutConfirmOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsLogoutConfirmOpen(false);
        }}>
          <div className="confirm-modal yes-no-confirm" role="alertdialog" aria-modal="true" aria-labelledby="logout-dialog-title">
            <div className="yes-no-confirm-mark" aria-hidden="true">?</div>
            <div>
              <h2 id="logout-dialog-title">로그아웃 하시겠습니까?</h2>
              <p>로그아웃 후에는 다시 로그인해야<br />서비스를 이용할 수 있습니다.</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="button" onClick={handleLogout}>예</button>
              <button type="button" className="ghost-button" onClick={() => setIsLogoutConfirmOpen(false)}>아니오</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
