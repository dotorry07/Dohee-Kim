const registrationSchedule = [
  {
    title: "강의시간표 조회",
    period: "2026. 7. 29.(수) 이후",
    path: "수강신청시스템 > 개설강좌조회"
  },
  {
    title: "관심 강좌 신청",
    period: "2026. 8. 5.(수) 10:00 ~ 8. 11.(화) 17:00",
    path: "수강신청시스템 > 관심강좌신청"
  },
  {
    title: "수강신청",
    period: "2026. 8. 19.(수) 10:00 ~ 8. 21.(금) 17:00",
    path: "수강신청시스템 > 수강신청"
  },
  {
    title: "수강정정",
    period: "2026. 9. 1.(화) 13:00 ~ 9. 8.(화) 11:00",
    path: "수강신청시스템"
  },
  {
    title: "수강철회",
    period: "2026. 9. 22.(화) 10:00 ~ 9. 29.(화) 17:00",
    path: "통합정보시스템 > 수강철회/포기신청"
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
  "성신 알리미",
  "수강신청 앱",
  "스마트캠퍼스",
  "성신 모바일 신분증",
  "도서관 시설 예약",
  "코스모스"
];

const helpfulApps = [
  "에브리타임",
  "노크",
  "링커리어",
  "캠퍼스픽"
];

export default function MustReadPage() {
  return (
    <main className="page">
      <section className="page-header">
        <span className="badge">2026학년도 2학기</span>
        <h1>필수 수강신청 안내</h1>
        <p>성신여대 학사운영팀의 2026학년도 2학기 수강신청 안내를 새내기가 먼저 확인해야 할 일정과 유의사항 중심으로 정리했습니다.</p>
      </section>

      <section className="grid two">
        <div className="panel">
          <div className="section-title">
            <div>
              <span className="badge">일정</span>
              <h2>수강신청 기간</h2>
            </div>
          </div>
          <div className="list">
            {registrationSchedule.map((item) => (
              <article className="list-item" key={item.title}>
                <div className="section-title">
                  <h3>{item.title}</h3>
                  <span className="badge">{item.period}</span>
                </div>
                <span className="muted">{item.path}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-title">
            <div>
              <span className="badge">새내기</span>
              <h2>먼저 확인할 내용</h2>
            </div>
          </div>
          <div className="list">
            {freshmanNotes.map((note) => (
              <div className="list-item" key={note}>
                <strong>{note}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-title">
          <div>
            <span className="badge">체크리스트</span>
            <h2>수강신청 전에 꼭 볼 것</h2>
          </div>
        </div>
        <div className="list">
          {requiredChecks.map((check) => (
            <div className="list-item" key={check}>
              <span>{check}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid two" style={{ marginTop: 16 }}>
        <div className="panel">
          <div className="section-title">
            <div>
              <span className="badge">필수 어플</span>
              <h2>학교 공식 시스템 및 필수 앱</h2>
            </div>
          </div>
          <div className="list">
            {requiredApps.map((app) => (
              <div className="list-item" key={app}>
                <strong>{app}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-title">
            <div>
              <span className="badge">도움 어플</span>
              <h2>대학생활 유용 앱</h2>
            </div>
          </div>
          <div className="list">
            {helpfulApps.map((app) => (
              <div className="list-item" key={app}>
                <strong>{app}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-title">
          <div>
            <span className="badge">문의</span>
            <h2>문의처와 바로가기</h2>
          </div>
        </div>
        <div className="grid three">
          <div className="list-item">
            <strong>일반 수강신청</strong>
            <span className="muted">학사운영팀 02-920-7018, 7844</span>
          </div>
          <div className="list-item">
            <strong>교양 수강신청</strong>
            <span className="muted">창의융합 교학팀 02-920-7228, 7150</span>
          </div>
          <div className="list-item">
            <strong>학점교류</strong>
            <span className="muted">학사운영팀 02-920-7022</span>
          </div>
        </div>
        <div className="meta" style={{ marginTop: 14 }}>
          <a className="button" href="http://sugang.sungshin.ac.kr" rel="noreferrer" target="_blank">수강신청시스템</a>
          <a className="ghost-button" href="https://tis.sungshin.ac.kr" rel="noreferrer" target="_blank">통합정보시스템</a>
          <a className="ghost-button" href="https://www.sungshin.ac.kr/bbs/main_kor/3181/157409/artclView.do" rel="noreferrer" target="_blank">원문 공지</a>
        </div>
      </section>
    </main>
  );
}
