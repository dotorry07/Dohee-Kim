import Link from "next/link";
import { notices, posts, courseReviews } from "@/lib/data";

export default function HomePage() {
  return (
    <>
      <section className="hero-band">
        <div className="hero-content">
          <h1>새내기 ON</h1>
          <p>
            시간표 추천, 캠퍼스 위치 확인, 주요 공지, 게시판과 강의평을 한곳에서 확인하는 성신여대 신입생 생활 도우미입니다.
          </p>
          <div className="chip-row">
            <Link className="button" href="/auth/signup">회원가입</Link>
            <Link className="ghost-button" href="/dashboard">대시보드 보기</Link>
          </div>
        </div>
      </section>
      <main className="page">
        <section className="grid three">
          <article className="panel">
            <div className="section-title">
              <h2>중요 공지</h2>
              <Link href="/notices" className="badge">전체</Link>
            </div>
            <div className="list">
              {notices.filter((notice) => notice.isPinned).slice(0, 3).map((notice) => (
                <div className="list-item" key={notice.id}>
                  <strong>{notice.title}</strong>
                  <span className="muted">{notice.summary}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="panel">
            <div className="section-title">
              <h2>최근 게시글</h2>
              <Link href="/board" className="badge">게시판</Link>
            </div>
            <div className="list">
              {posts.slice(0, 3).map((post) => (
                <div className="list-item" key={post.id}>
                  <strong>{post.title}</strong>
                  <span className="muted">{post.authorName} · 댓글 {post.comments.length}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="panel">
            <div className="section-title">
              <h2>강의평</h2>
              <Link href="/reviews" className="badge">검색</Link>
            </div>
            <div className="list">
              {courseReviews.slice(0, 3).map((review) => (
                <div className="list-item" key={review.id}>
                  <strong>{review.courseName}</strong>
                  <span className="muted">{review.professorName} · {review.rating.toFixed(1)}점</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
