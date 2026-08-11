"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { signOut } from "@/lib/auth/client";
import { extractStudentNumber, getGradeFromStudentNumber } from "@/lib/student";
import type { UserProfile } from "@/lib/types";

type MyPageIconName = "bell" | "building" | "calendar" | "chevron" | "edit" | "id" | "lock" | "logout" | "mail" | "school" | "user";

function MyPageIcon({ name }: { name: MyPageIconName }) {
  const paths: Record<MyPageIconName, ReactNode> = {
    bell: <><path d="M6.8 16.5h10.4l-1.1-1.7V11a4.1 4.1 0 0 0-8.2 0v3.8z" /><path d="M10.2 18.2a2 2 0 0 0 3.6 0" /></>,
    building: <><path d="M5.5 19.5h13" /><path d="M7 19.5v-12l5-2.5 5 2.5v12" /><path d="M10 10h.1M14 10h.1M10 13h.1M14 13h.1" /></>,
    calendar: <><path d="M7 4.5v3M17 4.5v3M5 8.5h14M6 6h12a1.5 1.5 0 0 1 1.5 1.5v11H4.5v-11A1.5 1.5 0 0 1 6 6Z" /><path d="M8 12.5h2M14 12.5h2M8 16h2" /></>,
    chevron: <path d="m10 6 6 6-6 6" />,
    edit: <><path d="M5 18.8h4l9.5-9.5a2.1 2.1 0 0 0-3-3L6 15.8z" /><path d="M13.8 8 16 10.2" /></>,
    id: <><path d="M5 6.5h14v11H5z" /><circle cx="10" cy="11" r="2" /><path d="M8 15c.5-1.2 1.2-1.8 2-1.8s1.5.6 2 1.8M14.5 10h2M14.5 13h2" /></>,
    lock: <><path d="M7 10h10v9H7z" /><path d="M9.2 10V7.8a2.8 2.8 0 0 1 5.6 0V10" /><path d="M12 14v1.8" /></>,
    logout: <><path d="M10 6H6.5v12H10" /><path d="M13 8.5 16.5 12 13 15.5" /><path d="M16.5 12H9.5" /></>,
    mail: <><path d="M5 7h14v10H5z" /><path d="m5.5 8 6.5 5 6.5-5" /></>,
    school: <><path d="m4 9 8-4 8 4-8 4z" /><path d="M7 11.2v3.2c1.6 1.8 8.4 1.8 10 0v-3.2" /><path d="M20 9v5" /></>,
    user: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 19c1.2-3.5 3.4-5.2 6.5-5.2s5.3 1.7 6.5 5.2" /></>
  };

  return (
    <svg aria-hidden="true" className="mypage-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(date));
}

export default function MyPage() {
  return <AuthGuard>{(user) => <MyPageContent user={user} />}</AuthGuard>;
}

function MyPageContent({ user }: { user: UserProfile }) {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const storedStudentNumber = extractStudentNumber(user.id);
  const studentNumber = storedStudentNumber || "학번 미등록";
  const displayGrade = storedStudentNumber ? getGradeFromStudentNumber(storedStudentNumber) : user.grade;
  const profileInitial = (user.nickname || user.name).slice(0, 1);

  const handleLogout = () => {
    signOut();
    setIsLogoutConfirmOpen(false);
    window.location.href = "/";
  };

  const accountRows = [
    { icon: "user" as const, label: "이름", value: user.name },
    { icon: "id" as const, label: "닉네임", value: user.nickname },
    { icon: "mail" as const, label: "이메일", value: user.email },
    { icon: "school" as const, label: "학번", value: studentNumber },
    { icon: "building" as const, label: "소속", value: user.department },
    ...(user.secondaryDepartment ? [{ icon: "building" as const, label: "부/복수전공", value: user.secondaryDepartment }] : []),
    { icon: "calendar" as const, label: "가입일", value: formatDate(user.createdAt) }
  ];

  return (
    <main className="page mypage-page">
      <section className="mypage-hero" aria-labelledby="mypage-title">
        <div className="mypage-hero-inner">
          <div className="mypage-hero-copy">
            <h1 id="mypage-title">마이페이지</h1>
            <p>내 프로필과 학교생활 관리 메뉴를 확인합니다.</p>
          </div>
          <div className="mypage-hero-art" aria-hidden="true">
            <img src="/images/mypage-banner.png" alt="" />
          </div>
        </div>
      </section>

      <section className="grid two mypage-layout">
        <article className="panel mypage-profile">
          <div className="mypage-avatar" aria-hidden="true">{profileInitial}</div>
          <div className="mypage-profile-copy">
            <p className="mypage-eyebrow">MY PROFILE</p>
            <div className="mypage-name-row">
              <h2>{user.nickname || user.name}</h2>
              <Link className="mypage-edit-button" href="/mypage/edit"><MyPageIcon name="edit" />프로필 수정</Link>
            </div>
            <p className="muted">{user.department} · {displayGrade}학년</p>
          </div>
        </article>

        <article className="panel mypage-manage">
          <div className="section-title">
            <h2>내 정보 관리</h2>
          </div>
          <div className="mypage-manage-actions">
            <button type="button">
              <span><MyPageIcon name="lock" /></span>
              비밀번호 변경
            </button>
            <Link href="/mypage/edit">
              <span><MyPageIcon name="user" /></span>
              개인정보 수정
            </Link>
            <button type="button">
              <span><MyPageIcon name="bell" /></span>
              알림 설정
            </button>
            <button type="button" onClick={() => setIsLogoutConfirmOpen(true)}>
              <span><MyPageIcon name="logout" /></span>
              로그아웃
            </button>
          </div>
        </article>
      </section>

      <section className="panel mypage-details">
        <div className="section-title">
          <h2>계정 정보</h2>
        </div>
        <dl>
          {accountRows.map((row) => (
            <div key={row.label}>
              <dt><span><MyPageIcon name={row.icon} /></span>{row.label}</dt>
              <dd>{row.value}</dd>
              <Link href="/mypage/edit" aria-label={`${row.label} 수정`}>
                <MyPageIcon name="chevron" />
              </Link>
            </div>
          ))}
        </dl>
      </section>

      {isLogoutConfirmOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsLogoutConfirmOpen(false);
        }}>
          <div className="confirm-modal yes-no-confirm" role="alertdialog" aria-modal="true" aria-labelledby="mypage-logout-dialog-title">
            <div className="yes-no-confirm-mark" aria-hidden="true">?</div>
            <div>
              <h2 id="mypage-logout-dialog-title">로그아웃 하시겠습니까?</h2>
              <p>로그아웃 후에는 다시 로그인해야<br />서비스를 이용할 수 있습니다.</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="button" onClick={handleLogout}>예</button>
              <button type="button" className="ghost-button" onClick={() => setIsLogoutConfirmOpen(false)}>아니오</button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .mypage-page {
          max-width: none;
          padding: 0 0 56px;
          background:
            linear-gradient(180deg, #f0e1ff 0%, #f7f0ff 24%, #faf9f6 34%, #faf9f6 100%);
        }

        .mypage-page > :not(.mypage-hero) {
          width: min(1180px, calc(100vw - 40px));
          margin-right: auto;
          margin-left: auto;
        }

        .mypage-hero {
          position: relative;
          width: 100vw;
          min-height: 246px;
          margin: 0 calc(50% - 50vw) 20px;
          overflow: hidden;
          background: transparent;
        }

        .mypage-hero-inner {
          position: relative;
          z-index: 1;
          display: flex;
          width: 100%;
          max-width: 1180px;
          min-height: 246px;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          margin: 0 auto;
          padding: 34px 38px 24px;
        }

        .mypage-hero-copy {
          position: relative;
          z-index: 2;
        }

        .mypage-hero h1 {
          margin: 0 0 10px;
          color: #21192b;
          font-family: "NanumSquareRoundExtraBold", "NanumSquareRound", Arial, Helvetica, sans-serif;
          font-size: clamp(44px, 5vw, 62px);
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: 0;
        }

        .mypage-hero p {
          max-width: 680px;
          margin: 0;
          color: #4e435d;
          font-size: 16px;
          font-weight: 750;
          line-height: 1.7;
        }

        .mypage-hero-art {
          position: relative;
          flex: 0 0 365px;
          width: 365px;
          height: 220px;
          margin-right: 10px;
        }

        .mypage-hero-art img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
        }

        .mypage-layout {
          align-items: stretch;
          gap: 20px;
          margin-bottom: 20px;
        }

        .mypage-profile {
          display: flex;
          align-items: center;
          gap: 22px;
          min-height: 142px;
          padding: 34px 38px;
        }

        .mypage-avatar {
          display: grid;
          width: 86px;
          height: 86px;
          flex: 0 0 86px;
          place-items: center;
          border-radius: 50%;
          background: linear-gradient(135deg, #f4eaff 0%, #e8d7ff 100%);
          color: var(--primary);
          font-size: 34px;
          font-family: "NanumSquareRoundExtraBold", "NanumSquareRound", Arial, Helvetica, sans-serif;
          font-weight: 900;
        }

        .mypage-profile-copy {
          min-width: 0;
          flex: 1;
        }

        .mypage-eyebrow {
          margin: 0 0 6px;
          color: var(--primary);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .mypage-name-row {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 12px;
        }

        .mypage-profile h2 {
          min-width: 0;
          margin: 0;
          overflow: hidden;
          color: #171326;
          font-size: 28px;
          line-height: 1.25;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mypage-edit-button {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 5px;
          border: 1px solid #b899ef;
          border-radius: 8px;
          background: #fff;
          color: var(--primary);
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 900;
        }

        .mypage-edit-button :global(.mypage-icon) {
          width: 13px;
          height: 13px;
        }

        .mypage-manage {
          min-height: 142px;
          padding: 24px 38px 26px;
        }

        .mypage-manage .section-title {
          margin-bottom: 18px;
        }

        .mypage-manage-actions {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: stretch;
        }

        .mypage-manage-actions button,
        .mypage-manage-actions a {
          display: flex;
          min-width: 0;
          min-height: 78px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 0;
          border-left: 1px solid #e5ddeb;
          background: transparent;
          color: var(--primary);
          font-size: 13px;
          font-weight: 900;
        }

        .mypage-manage-actions button:first-child,
        .mypage-manage-actions a:first-child {
          border-left: 0;
        }

        .mypage-manage-actions span,
        .mypage-details dt span {
          display: grid;
          width: 52px;
          height: 52px;
          place-items: center;
          border: 1px solid rgba(88, 47, 130, 0.08);
          border-radius: 8px;
          background: linear-gradient(135deg, #f5edff 0%, #ece0ff 100%);
          color: #7036d8;
        }

        .mypage-manage-actions span :global(.mypage-icon) {
          width: 28px;
          height: 28px;
        }

        .section-title h2 {
          margin: 0;
          color: #171326;
          font-size: 21px;
          font-weight: 900;
        }

        .mypage-details dl {
          display: grid;
          gap: 0;
          margin: 0;
        }

        .mypage-details div {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr) 30px;
          align-items: center;
          gap: 16px;
          min-height: 62px;
          padding: 9px 16px 9px 8px;
          border-top: 1px solid var(--line);
        }

        .mypage-details div:first-child {
          border-top: 0;
        }

        .mypage-details dt {
          display: flex;
          align-items: center;
          gap: 18px;
          color: #716884;
          font-weight: 800;
        }

        .mypage-details dt span {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
        }

        .mypage-details dt span :global(.mypage-icon) {
          width: 21px;
          height: 21px;
        }

        .mypage-details dd {
          min-width: 0;
          margin: 0;
          overflow-wrap: anywhere;
          color: #171326;
          font-weight: 800;
        }

        .mypage-details button,
        .mypage-details a {
          display: grid;
          width: 30px;
          height: 30px;
          place-items: center;
          border: 0;
          background: transparent;
          color: #7f7296;
        }

        .mypage-details button :global(.mypage-icon),
        .mypage-details a :global(.mypage-icon) {
          width: 18px;
          height: 18px;
        }

        :global(.mypage-icon) {
          display: block;
          width: 24px;
          height: 24px;
        }

        @media (max-width: 760px) {
          .mypage-page > :not(.mypage-hero) {
            width: min(100% - 28px, 1180px);
          }

          .mypage-hero {
            min-height: 220px;
            margin-bottom: 28px;
          }

          .mypage-hero-inner {
            min-height: 220px;
            padding: 28px 20px 24px;
          }

          .mypage-hero h1 {
            font-size: 40px;
          }

          .mypage-hero p {
            max-width: calc(100% - 64px);
            font-size: 14px;
          }

          .mypage-hero-art {
            position: absolute;
            top: 10px;
            right: -74px;
            width: 220px;
            height: 180px;
            margin-right: 0;
            opacity: 0.58;
          }

          .mypage-layout {
            grid-template-columns: 1fr;
          }

          .mypage-profile {
            align-items: flex-start;
            padding: 24px;
          }

          .mypage-name-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
          }

          .mypage-manage {
            padding: 22px 20px;
          }

          .mypage-manage-actions {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            row-gap: 14px;
          }

          .mypage-manage-actions button:nth-child(odd),
          .mypage-manage-actions a:nth-child(odd) {
            border-left: 0;
          }

          .mypage-manage-actions button:nth-child(n + 3),
          .mypage-manage-actions a:nth-child(n + 3) {
            border-top: 1px solid #e5ddeb;
            padding-top: 14px;
          }

          .mypage-details div {
            grid-template-columns: 1fr auto;
            gap: 5px;
            padding: 12px 8px;
          }

          .mypage-details dt {
            grid-column: 1;
          }

          .mypage-details dd {
            grid-column: 1;
            padding-left: 56px;
          }

          .mypage-details button,
          .mypage-details a {
            grid-column: 2;
            grid-row: 1 / span 2;
          }
        }
      `}</style>
    </main>
  );
}
