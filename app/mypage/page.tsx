"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import type { UserProfile } from "@/lib/types";

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
  const studentNumber = user.id.replace(/\D/g, "").slice(-8) || "학번 미등록";

  return (
    <main className="page mypage-page">
      <section className="page-header">
        <h1>마이페이지</h1>
        <p>내 프로필과 학교생활 관리 메뉴를 확인합니다.</p>
      </section>

      <section className="grid two mypage-layout">
        <article className="panel mypage-profile">
          <div className="mypage-avatar" aria-hidden="true">{(user.nickname || user.name).slice(0, 1)}</div>
          <div>
            <p className="mypage-eyebrow">MY PROFILE</p>
            <h2>{user.nickname || user.name}</h2>
            <p className="muted">{user.department} · {user.grade}학년</p>
          </div>
        </article>

        <article className="panel">
          <div className="section-title">
            <h2>빠른 이동</h2>
          </div>
          <div className="mypage-actions">
            <Link className="button" href="/timetable">시간표 관리</Link>
            <Link className="ghost-button" href="/board?view=my-posts">내 게시글</Link>
            <Link className="ghost-button" href="/board?view=my-comments">내 댓글</Link>
          </div>
        </article>
      </section>

      <section className="panel mypage-details">
        <div className="section-title">
          <h2>계정 정보</h2>
        </div>
        <dl>
          <div><dt>이름</dt><dd>{user.name}</dd></div>
          <div><dt>닉네임</dt><dd>{user.nickname}</dd></div>
          <div><dt>이메일</dt><dd>{user.email}</dd></div>
          <div><dt>학번</dt><dd>{studentNumber}</dd></div>
          <div><dt>소속</dt><dd>{user.department}</dd></div>
          {user.secondaryDepartment ? <div><dt>부/복수전공</dt><dd>{user.secondaryDepartment}</dd></div> : null}
          <div><dt>가입일</dt><dd>{formatDate(user.createdAt)}</dd></div>
        </dl>
      </section>

      <style jsx>{`
        .mypage-layout {
          align-items: stretch;
          margin-bottom: 16px;
        }

        .mypage-profile {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .mypage-avatar {
          display: grid;
          width: 72px;
          height: 72px;
          flex: 0 0 72px;
          place-items: center;
          border-radius: 50%;
          background: #efe8fb;
          color: var(--primary);
          font-size: 30px;
          font-weight: 900;
        }

        .mypage-eyebrow {
          margin: 0 0 6px;
          color: var(--primary);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0;
        }

        .mypage-profile h2 {
          margin: 0 0 6px;
          font-size: 28px;
        }

        .mypage-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .mypage-details dl {
          display: grid;
          gap: 0;
          margin: 0;
        }

        .mypage-details div {
          display: grid;
          grid-template-columns: 140px minmax(0, 1fr);
          gap: 16px;
          padding: 14px 0;
          border-top: 1px solid var(--line);
        }

        .mypage-details div:first-child {
          border-top: 0;
        }

        .mypage-details dt {
          color: var(--muted);
          font-weight: 700;
        }

        .mypage-details dd {
          min-width: 0;
          margin: 0;
          overflow-wrap: anywhere;
          font-weight: 800;
        }

        @media (max-width: 760px) {
          .mypage-layout {
            grid-template-columns: 1fr;
          }

          .mypage-profile {
            align-items: flex-start;
          }

          .mypage-details div {
            grid-template-columns: 1fr;
            gap: 5px;
          }
        }
      `}</style>
    </main>
  );
}
