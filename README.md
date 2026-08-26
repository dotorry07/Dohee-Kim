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

## 인증 Provider

인증 화면은 동일한 클라이언트 래퍼를 통해 mock API와 Supabase Auth를 전환합니다.

- `NEXT_PUBLIC_AUTH_PROVIDER=auto`(기본): Supabase URL과 public key가 모두 있으면 Supabase, 아니면 mock API
- `NEXT_PUBLIC_AUTH_PROVIDER=mock`: 환경변수와 관계없이 mock API
- `NEXT_PUBLIC_AUTH_PROVIDER=supabase`: Supabase Auth를 강제로 사용하며, 키가 빠졌으면 설정 오류 표시

mock API는 `login`, `me`, `logout`, `signup`을 제공하고 서명된 HTTP-only 쿠키로 8시간 세션을 유지합니다. 브라우저별 mock 가입 계정은 최대 5개까지 30일 동안 서명된 쿠키에 저장됩니다. 배포된 데모에서는 `MOCK_AUTH_SECRET`에 충분히 긴 임의 문자열을 설정하세요. mock 인증은 시연·프론트엔드 개발용이며 실제 사용자 인증을 대신하지 않습니다.

mock 모드의 시간표 목록·저장·삭제·대표 시간표 선택과 알림 선호 설정은 브라우저 `localStorage`를 사용합니다. 따라서 Supabase 키가 없어도 시간표 편집 화면에서 `Timetable request failed.` 오류 없이 저장할 수 있습니다.

```text
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
POST /api/auth/signup
```

기본 시연 계정은 `freshman@sungshin.ac.kr` / `password123`입니다.

개발 서버에서 `Cannot find module './<chunk>.js'` 오류가 발생하면 실행 중인 개발 서버와 프로덕션 빌드가 같은 `.next` 디렉터리를 동시에 변경하지 않았는지 확인하세요. 모든 Next 프로세스를 종료하고 `.next` 생성 캐시를 비운 뒤 `npm run dev`를 다시 실행하면 됩니다.
