import { BannerTagIcon } from "@/components/BannerTagIcon";

const registrationSchedule = [
  {
    title: "강의시간표 조회",
    period: "2026. 7. 29.(수) 이후",
    path: "수강신청시스템 > 개설강좌조회",
    icon: "calendar" as const
  },
  {
    title: "관심 강좌 신청",
    period: "2026. 8. 5.(수) 10:00 ~ 8. 11.(화) 17:00",
    path: "수강신청시스템 > 관심강좌신청",
    icon: "bell" as const
  },
  {
    title: "수강신청",
    period: "2026. 8. 19.(수) 10:00 ~ 8. 21.(금) 17:00",
    path: "수강신청시스템 > 수강신청",
    icon: "edit" as const
  },
  {
    title: "수강정정",
    period: "2026. 9. 1.(화) 13:00 ~ 9. 8.(화) 11:00",
    path: "수강신청시스템",
    icon: "checklist" as const
  },
  {
    title: "수강철회",
    period: "2026. 9. 22.(화) 10:00 ~ 9. 29.(화) 17:00",
    path: "통합정보시스템 > 수강철회/포기신청",
    icon: "clock" as const
  }
];

const requiredChecks = [
  "관심강좌신청은 수강신청이 아니므로, 반드시 수강신청 기간에 다시 신청을 완료해야 합니다.",
  "수강신청 완료 후 이수구분, 분반, 수업시간, 담당교수를 확인하고 수강신청내역확인 메뉴에서 최종 내역을 확인합니다.",
  "원격수업은 학기당 9학점 이내, KCU/OCU 사이버대학 강좌는 학기당 3학점 이내로 신청할 수 있습니다.",
  "비대면 강좌도 오프라인 시험이 있을 수 있으므로 수업계획서의 시험 일정을 먼저 확인합니다.",
  "2026학년도 2학기부터 집중이수제가 시범운영되므로 해당 강좌는 다른 수업과 일정이 겹치지 않는지 확인합니다.",
  "수강신청 부정행위가 확인되면 수강신청 내역 삭제나 징계 등 제재가 있을 수 있습니다."
];

const freshmanNotes = [
  "학년별 수강신청은 실시하지 않습니다.",
  "신입생/편입생은 학번 부여 전 아이디로 수험번호를 사용하고, 초기 비밀번호는 주민등록번호 뒤 7자리입니다.",
  "1학년 필수 공통교양은 자동 수강신청되며 수강철회가 불가합니다.",
  "필수 공통교양은 대면수업으로 진행됩니다."
];

const requiredApps = [
  { name: "성신 알리미", iconSrc: "/images/apps/sungshin-alimi.webp" },
  { name: "수강신청 앱", iconSrc: "/images/apps/sungshin-course-registration.webp" },
  { name: "스마트캠퍼스", iconSrc: "/images/apps/sungshin-smart-campus.webp" },
  { name: "성신 모바일 신분증", iconSrc: "/images/apps/sungshin-mobile-id.webp" },
  { name: "도서관 시설 예약", iconSrc: "/images/apps/sungshin-library-reservation.webp" },
  { name: "코스모스", iconSrc: "/images/apps/cosmos.webp" }
];

const helpfulApps = [
  { name: "에브리타임", iconSrc: "/images/apps/everytime.webp" },
  { name: "노크", iconSrc: "/images/apps/knock.webp" },
  { name: "링커리어", iconSrc: "/images/apps/linkareer.webp" },
  { name: "캠퍼스픽", iconSrc: "/images/apps/campuspick.webp" }
];

export default function MustReadPage() {
  return (
    <main className="page must-read-page">
      <section className="page-header must-read-page-header">
        <div className="app-banner-inner">
          <div className="app-banner-copy">
            <h1>새내기 필독</h1>
            <p>수강신청 일정, 필수 확인사항, 학교 공식 앱을 한눈에 확인합니다.</p>
            <div className="app-banner-tags" aria-hidden="true">
              <span><BannerTagIcon icon="checklist" />수강신청</span>
              <span><BannerTagIcon icon="bell" />필수 안내</span>
              <span><BannerTagIcon icon="phone" />학교 앱</span>
              <span><BannerTagIcon icon="pin" />문의처</span>
            </div>
          </div>
          <div className="app-banner-art must-read-banner-art" aria-hidden="true">
            <img src="/images/banner-must-read.png" alt="" />
          </div>
        </div>
      </section>

      <section className="grid two">
        <div className="panel">
          <div className="section-title must-read-section-title">
            <span className="must-read-title-icon"><BannerTagIcon icon="calendar" /></span>
            <div>
              <h2>수강신청 기간</h2>
              <p>주요 일정을 확인하세요.</p>
            </div>
          </div>
          <div className="list">
            {registrationSchedule.map((item) => (
              <article className="list-item must-read-schedule-item" key={item.title}>
                <span className="must-read-item-icon"><BannerTagIcon icon={item.icon} /></span>
                <div className="must-read-item-copy">
                  <h3>{item.title}</h3>
                  <span className="muted">{item.path}</span>
                </div>
                <span className="badge must-read-period-badge">{item.period}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-title must-read-section-title">
            <span className="must-read-title-icon"><BannerTagIcon icon="bell" /></span>
            <div>
              <h2>먼저 확인할 내용</h2>
              <p>필수 확인사항을 꼭 읽어주세요.</p>
            </div>
          </div>
          <div className="list">
            {freshmanNotes.map((note) => (
              <div className="list-item must-read-note-item" key={note}>
                <span className="must-read-item-icon"><BannerTagIcon icon="bell" /></span>
                <strong>{note}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-title must-read-section-title">
          <span className="must-read-title-icon"><BannerTagIcon icon="checklist" /></span>
          <div>
            <h2>수강신청 전에 꼭 볼 것</h2>
            <p>신청 전 놓치기 쉬운 기준을 확인하세요.</p>
          </div>
          <a className="ghost-button must-read-source-link" href="https://www.sungshin.ac.kr/bbs/main_kor/3181/157409/artclView.do" rel="noreferrer" target="_blank">
            <BannerTagIcon icon="link" />
            원문 공지
          </a>
        </div>
        <div className="list">
          {requiredChecks.map((check) => (
            <div className="list-item must-read-note-item" key={check}>
              <span className="must-read-item-icon"><BannerTagIcon icon="checkCircle" /></span>
              <span>{check}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-title must-read-section-title">
          <span className="must-read-title-icon"><BannerTagIcon icon="pin" /></span>
          <div>
            <h2>문의처와 바로가기</h2>
            <p>필요한 부서와 시스템으로 바로 이동하세요.</p>
          </div>
        </div>
        <div className="grid three">
          <div className="list-item must-read-contact-item">
            <span className="must-read-item-icon"><BannerTagIcon icon="call" /></span>
            <div>
              <strong>일반 수강신청</strong>
              <span className="muted">학사운영팀 02-920-7018, 7844</span>
            </div>
          </div>
          <div className="list-item must-read-contact-item">
            <span className="must-read-item-icon"><BannerTagIcon icon="call" /></span>
            <div>
              <strong>교양 수강신청</strong>
              <span className="muted">창의융합 교학팀 02-920-7228, 7150</span>
            </div>
          </div>
          <div className="list-item must-read-contact-item">
            <span className="must-read-item-icon"><BannerTagIcon icon="call" /></span>
            <div>
              <strong>학점교류</strong>
              <span className="muted">학사운영팀 02-920-7022</span>
            </div>
          </div>
        </div>
        <div className="meta" style={{ marginTop: 14 }}>
          <a className="button" href="http://sugang.sungshin.ac.kr" rel="noreferrer" target="_blank">수강신청시스템</a>
          <a className="ghost-button" href="https://tis.sungshin.ac.kr" rel="noreferrer" target="_blank">통합정보시스템</a>
        </div>
      </section>

      <section className="grid two" style={{ marginTop: 16 }}>
        <div className="panel">
          <div className="section-title must-read-section-title">
            <span className="must-read-title-icon"><BannerTagIcon icon="phone" /></span>
            <div>
              <h2>학교 공식 시스템 및 필수 앱</h2>
              <p>학교생활에 필요한 앱을 모았습니다.</p>
            </div>
          </div>
          <div className="list">
            {requiredApps.map((app) => (
              <div className="list-item must-read-app-item" key={app.name}>
                <img src={app.iconSrc} alt="" aria-hidden="true" />
                <strong>{app.name}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-title must-read-section-title">
            <span className="must-read-title-icon"><BannerTagIcon icon="star" /></span>
            <div>
              <h2>대학생활 유용 앱</h2>
              <p>정보 탐색과 커뮤니티에 유용합니다.</p>
            </div>
          </div>
          <div className="list">
            {helpfulApps.map((app) => (
              <div className="list-item must-read-app-item" key={app.name}>
                <img src={app.iconSrc} alt="" aria-hidden="true" />
                <strong>{app.name}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
