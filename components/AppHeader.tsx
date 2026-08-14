"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUser, onAuthStateChange, signOut } from "@/lib/auth/client";
import type { UserProfile } from "@/lib/types";

const links = [
  ["새내기 필독", "/must-read"],
  ["대시보드", "/dashboard"],
  ["공지", "/notices"],
  ["시간표", "/timetable"],
  ["지도", "/map"],
  ["게시판", "/board"]
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const profileMenuRef = useRef<HTMLSpanElement | null>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });
  const activeLink = links.find(([, href]) => pathname === href || pathname.startsWith(`${href}/`));
  const profileInitial = (user?.nickname || user?.name || "새").slice(0, 1);

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
    let active = true;
    void getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleProfileUpdated = () => {
      void getCurrentUser().then(setUser).catch(() => setUser(null));
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("newbie-on:mypage-profile-updated", handleProfileUpdated);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("newbie-on:mypage-profile-updated", handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [pathname]);

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

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setIsProfileMenuOpen(false);
    setIsLogoutConfirmOpen(false);
    window.location.href = "/auth/login";
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
            {user ? (
              <span className="nav-auth-actions" ref={profileMenuRef}>
                <button
                  className="nav-profile-button"
                  type="button"
                  aria-label="프로필 메뉴 열기"
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                  onClick={() => setIsProfileMenuOpen((open) => !open)}
                >
                  <span
                    className={user.profileImageUrl ? "nav-profile-avatar has-image" : "nav-profile-avatar"}
                    style={user.profileImageUrl ? { backgroundImage: `url(${user.profileImageUrl})` } : undefined}
                    aria-hidden="true"
                  >
                    {user.profileImageUrl ? null : profileInitial}
                  </span>
                </button>
                {isProfileMenuOpen ? (
                  <span className="nav-profile-menu" role="menu">
                    <Link className={pathname.startsWith("/mypage") ? "nav-profile-menu-item active" : "nav-profile-menu-item"} href="/mypage" role="menuitem">
                      <HeaderMenuIcon name="user" />마이페이지
                    </Link>
                    <button className="nav-profile-menu-item logout" type="button" role="menuitem" onClick={() => setIsLogoutConfirmOpen(true)}>
                      <span className="nav-profile-menu-icon-box"><HeaderMenuIcon name="logout" /></span>로그아웃
                    </button>
                  </span>
                ) : null}
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

function HeaderMenuIcon({ name }: { name: "logout" | "user" }) {
  return (
    <svg className="nav-profile-menu-icon" viewBox="0 0 24 24" aria-hidden="true">
      {name === "user" ? (
        <>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 19c1.2-3.5 3.4-5.2 6.5-5.2s5.3 1.7 6.5 5.2" />
        </>
      ) : (
        <>
          <path d="M10 6H6.5v12H10" />
          <path d="M13 8.5 16.5 12 13 15.5" />
          <path d="M16.5 12H9.5" />
        </>
      )}
    </svg>
  );
}
