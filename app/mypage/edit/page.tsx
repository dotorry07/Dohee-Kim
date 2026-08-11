"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { updateStoredProfile } from "@/lib/auth/client";
import { getBoardPosts, saveBoardPosts } from "@/lib/board-storage";
import type { UserProfile } from "@/lib/types";

export default function MyPageEdit() {
  return <AuthGuard>{(user) => <MyPageEditContent user={user} />}</AuthGuard>;
}

function MyPageEditContent({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name,
    nickname: user.nickname,
    department: user.department,
    secondaryDepartment: user.secondaryDepartment ?? ""
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const nickname = form.nickname.trim();
    const department = form.department.trim();
    const secondaryDepartment = form.secondaryDepartment.trim();

    if (name.length < 2) {
      setError("이름은 2자 이상 입력해 주세요.");
      return;
    }
    if (nickname.length < 2 || nickname.length > 12) {
      setError("닉네임은 2~12자로 입력해 주세요.");
      return;
    }
    if (!department) {
      setError("소속을 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    setError("");

    updateStoredProfile({ name, nickname, department, secondaryDepartment });

    const posts = getBoardPosts();
    const nextPosts = posts.map((post) => ({
      ...post,
      authorName: post.userId === user.id ? nickname : post.authorName,
      comments: post.comments.map((comment) => (
        comment.userId === user.id ? { ...comment, authorName: nickname } : comment
      ))
    }));
    await saveBoardPosts(nextPosts);

    router.push("/mypage");
  }

  return (
    <main className="page mypage-edit-page">
      <section className="panel mypage-edit-panel">
        <div className="mypage-edit-header">
          <div>
            <p>MY PROFILE</p>
            <h1>개인정보 수정</h1>
          </div>
          <Link className="ghost-button" href="/mypage">돌아가기</Link>
        </div>

        <form className="form mypage-edit-form" onSubmit={saveProfile}>
          <div className="field">
            <label htmlFor="mypage-name">이름</label>
            <input
              id="mypage-name"
              maxLength={20}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="mypage-nickname">닉네임</label>
            <input
              id="mypage-nickname"
              maxLength={12}
              value={form.nickname}
              onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))}
            />
            <small className="field-help">게시판 작성자 이름도 이 닉네임으로 표시됩니다.</small>
          </div>
          <div className="field">
            <label htmlFor="mypage-department">소속</label>
            <input
              id="mypage-department"
              maxLength={40}
              value={form.department}
              onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="mypage-secondary-department">부/복수전공</label>
            <input
              id="mypage-secondary-department"
              maxLength={40}
              placeholder="미등록"
              value={form.secondaryDepartment}
              onChange={(event) => setForm((current) => ({ ...current, secondaryDepartment: event.target.value }))}
            />
          </div>

          {error ? <div className="error">{error}</div> : null}

          <div className="mypage-edit-actions">
            <button className="button" type="submit" disabled={isSaving}>
              {isSaving ? "저장 중" : "저장"}
            </button>
            <Link className="ghost-button" href="/mypage">취소</Link>
          </div>
        </form>
      </section>

      <style jsx>{`
        .mypage-edit-page {
          padding-top: 44px;
        }

        .mypage-edit-panel {
          max-width: 720px;
          margin: 0 auto;
          padding: 28px;
        }

        .mypage-edit-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 24px;
        }

        .mypage-edit-header p {
          margin: 0 0 6px;
          color: var(--primary);
          font-size: 12px;
          font-weight: 900;
        }

        .mypage-edit-header h1 {
          margin: 0;
          font-size: 28px;
          line-height: 1.2;
        }

        .mypage-edit-form {
          gap: 16px;
        }

        .mypage-edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 8px;
        }

        @media (max-width: 760px) {
          .mypage-edit-page {
            padding-top: 24px;
          }

          .mypage-edit-panel {
            width: min(100% - 28px, 720px);
            padding: 22px;
          }

          .mypage-edit-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .mypage-edit-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
