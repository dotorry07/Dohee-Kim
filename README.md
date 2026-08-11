# 새내기 ON

성신여자대학교 신입생이 첫 학기 학교생활에 필요한 시간표, 지도, 공지, 게시판을 한곳에서 확인하는 Next.js 기반 MVP입니다.

## 구현 범위

- 로컬 세션 기반 로그인/회원가입 화면과 입력값 검증
- 대시보드: 오늘 수업, 중요 공지, 최근 게시글
- 시간표: 필수 이수 강의 기반 추천 후보 생성, 개인 일정 겹침 검사, 주간 시간표, 강의 삭제
- 학교 지도: 정적 캠퍼스 약도, 장소 검색, 카테고리 필터, 시간표 건물 연결
- 공지사항: 중요 공지 상단 표시, 최신순 정렬, 검색/카테고리 필터
- 게시판: 목록/상세, 글 작성, 댓글 작성, 작성자 삭제 권한 표시
- Supabase PostgreSQL 초기 스키마 초안

## 실행

```bash
npm install
npm run dev
```

시연 계정:

- 이메일: `freshman@sungshin.ac.kr`
- 비밀번호: `password123`

## 구조

```text
app/                 Next.js 라우트와 API Route
components/          공통 UI 컴포넌트
lib/                 목 데이터, 타입, 인증, 시간표 추천 로직
public/images/       캠퍼스 약도
supabase/migrations/ DB 스키마 초안
plan/                기획 문서
```

## Supabase 연결

`.env.example`을 참고해 Supabase 환경변수를 채우면 `lib/supabase/client.ts`의 클라이언트 래퍼를 실제 인증/DB 연동에 사용할 수 있습니다. 현재 화면은 해커톤 시연을 위해 로컬 목 데이터로 동작합니다.
