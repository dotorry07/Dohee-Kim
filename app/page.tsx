import Link from "next/link";
import styles from "./page.module.css";

type IconName = "arrow" | "board" | "calendar" | "check" | "clock" | "map" | "meal" | "message" | "user";

function Icon({ name }: { name: IconName }) {
  const paths = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    board: <><path d="M4 5h16v14H4z" /><path d="M8 9h8M8 13h5" /></>,
    calendar: <><path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z" /><path d="M8 13h2M14 13h2M8 17h2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15M15 6v15" /></>,
    meal: <><path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11M17 3v18M17 3c3 2 3 8 0 10" /></>,
    message: <path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9 9 0 0 1-4-.9L3 21l1.7-4.2A8.5 8.5 0 1 1 21 11.5Z" />,
    user: <><circle cx="12" cy="7" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>
  };
  return <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const features = [
  { icon: "calendar" as const, number: "01", title: "스마트 시간표", description: "수업과 개인 일정을 실시간 태그로 한눈에 관리", className: styles.purpleCard, visual: <div className={styles.timetableVisual}><span>MON</span><span>TUE</span><span>WED</span><i className={styles.classOne}>전공 수업</i><i className={styles.classTwo}>개인 일정</i></div> },
  { icon: "meal" as const, number: "02", title: "오늘의 학식", description: "수정캠·운정캠 매일의 학식 메뉴와 운영 시간 안내", className: styles.yellowCard, visual: <div className={styles.mealVisual}><div><Icon name="meal" /></div><p><b>오늘의 메뉴</b><span>매일 새롭게 확인해요</span></p><em>11:00–14:00</em></div> },
  { icon: "map" as const, number: "03", title: "캠퍼스 길찾기", description: "건물 위치와 상세 정보까지 빠르게 이동", className: styles.blueCard, visual: <div className={styles.mapVisual}><span className={styles.mapLine} /><i className={styles.pinOne} /><i className={styles.pinTwo} /><b><Icon name="arrow" /> 빠른 길찾기</b></div> },
  { icon: "message" as const, number: "04", title: "새내기 커뮤니티", description: "신입생 간의 꿀팁 공유와 자유로운 소통 공간", className: styles.pinkCard, visual: <div className={styles.chatVisual}><div><Icon name="user" /><i /></div><p>선배님들, 새내기 꿀팁 알려주세요!</p><span><Icon name="message" /> 답변 12</span></div> }
];

export default function HomePage() {
  return <main className={styles.page}>
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}><i /> NEWBIE ON</span>
          <h1>슬기로운 대학생활의 시작,<br /><em>새내기 ON</em></h1>
          <p>시간표부터 학식, 학사일정까지! 새내기에게 필요한 모든 학교 정보를 한눈에 확인하세요.</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryCta} href="/auth/signup">새내기 ON 시작하기 <Icon name="arrow" /></Link>
            <Link className={styles.loginLink} href="/auth/login">이미 계정이 있나요? <strong>로그인</strong></Link>
          </div>
          <ul className={styles.benefits}><li><Icon name="check" /> 학교생활 정보 한곳에</li><li><Icon name="check" /> 가입 후 바로 이용</li></ul>
        </div>
        <div className={styles.heroVisual} aria-hidden="true">
          <span className={styles.glow} />
          <div className={styles.appPreview}>
            <div className={styles.previewHeader}><span><i /><i /><i /></span><b>NEWBIE ON</b><em /></div>
            <div className={styles.welcome}><small>WELCOME!</small><strong>오늘도 알찬 하루예요 👋</strong></div>
            <div className={styles.previewGrid}>
              <div><span><Icon name="clock" /></span><small>다음 수업</small><strong>프로그래밍 기초</strong><i>10:30 · 성신관 210</i></div>
              <div><span><Icon name="meal" /></span><small>오늘의 학식</small><strong>맛있는 점심 메뉴</strong><i>11:00–14:00</i></div>
            </div>
          </div>
          <span className={styles.floatingChip}><Icon name="calendar" /> D-9 수강신청</span>
          <span className={styles.floatingBubble}><Icon name="message" /></span>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.sectionHeading}><span>ALL IN ONE CAMPUS LIFE</span><h2>학교생활에 꼭 필요한 기능만<br />한곳에 모았어요</h2><p>복잡한 대학생활, 새내기 ON이 더 쉽고 편하게 만들어드릴게요.</p></div>
        <div className={styles.featureGrid}>{features.map((feature) => <article className={`${styles.featureCard} ${feature.className}`} key={feature.title}>
          <div className={styles.featureTop}><span className={styles.iconBox}><Icon name={feature.icon} /></span><i>{feature.number}</i></div>
          <div className={styles.featureVisual}>{feature.visual}</div>
          <h3>{feature.title}</h3><p>{feature.description}</p>
        </article>)}</div>
      </section>

      <section className={styles.bottomCta}>
        <span className={styles.ctaDecorationOne} aria-hidden="true" /><span className={styles.ctaDecorationTwo} aria-hidden="true" />
        <div><span>READY TO START?</span><h2>지금 바로 새내기 ON과 함께<br />스마트한 학교생활을 시작해보세요!</h2><p>새내기를 위한 모든 캠퍼스 정보가 기다리고 있어요.</p></div>
        <Link className={styles.whiteCta} href="/auth/login">로그인 / 회원가입 <Icon name="arrow" /></Link>
      </section>
    </div>
    <footer className={styles.footer}><div><Link className={styles.footerBrand} href="/">새내기 <strong>ON</strong></Link><p>성신여자대학교 신입생을 위한 스마트 캠퍼스 라이프 서비스</p></div><nav aria-label="서비스 정보"><Link href="/">서비스 소개</Link><Link href="/notices">공지사항</Link><Link href="/auth/login">로그인</Link></nav><small>© 2026 NEWBIE ON. All rights reserved.</small></footer>
  </main>;
}
