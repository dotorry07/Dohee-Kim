export interface CampusFacilityDetail {
  name: string;
  details: string[];
  detailSections?: Array<{ title: string; items: string[] }>;
  menuSections?: Array<{ name: string; items: string[] }>;
}

export interface CampusFloorDetail {
  label: string;
  facilities: CampusFacilityDetail[];
}

export interface CampusBuildingDetail {
  parentName: string;
  items: CampusFloorDetail[];
}

export const unjeongCampusBuildingDetails: Record<string, CampusBuildingDetail> = {
  p: {
    parentName: "P동",
    items: [
      { label: "10층", facilities: ["구내식당", "베이커리", "카페", "운송부"].map((name) => ({ name, details: [] })) },
      { label: "9층", facilities: ["인문융합예술대학장실", "교수실", "제5교학팀", "제6교학팀", "학생생활상담소", "대학원지원리플라스센터", "교강사휴게실"].map((name) => ({ name, details: [] })) },
      { label: "8층", facilities: ["미디어영상연기학과 / 무용예술학과 실기실", "하늘정원"].map((name) => ({ name, details: [] })) },
      { label: "7층", facilities: ["문화예술경영학과 / 미디어영상연기학과 / 현대실용음악학과 실기실"].map((name) => ({ name, details: [] })) },
      { label: "6층", facilities: ["뷰티산업학과 실습실"].map((name) => ({ name, details: [] })) },
      { label: "5층", facilities: ["운정도서관 열람실", "강의실"].map((name) => ({ name, details: [] })) },
      { label: "4층", facilities: ["운정도서관"].map((name) => ({ name, details: [] })) },
      { label: "3층", facilities: ["운정도서관"].map((name) => ({ name, details: [] })) },
      { label: "2층", facilities: ["대강당 2층"].map((name) => ({ name, details: [] })) },
      { label: "1층", facilities: ["대강당 1층"].map((name) => ({ name, details: [] })) },
      { label: "B1", facilities: ["기계실"].map((name) => ({ name, details: [] })) },
      { label: "B2", facilities: ["기계실"].map((name) => ({ name, details: [] })) },
      { label: "B3", facilities: ["기계실"].map((name) => ({ name, details: [] })) }
    ]
  },
  a: {
    parentName: "A동",
    items: [
      { label: "7층", facilities: ["바이오헬스융합학부", "바이오식품공학과 교수실 / 실험실"].map((name) => ({ name, details: [] })) },
      { label: "6층", facilities: ["바이오헬스융합학부", "바이오식품공학과 교수실 / 실험실", "실험공동실"].map((name) => ({ name, details: [] })) },
      { label: "5층", facilities: ["화학·에너지융합학부 교수실 / 실험실"].map((name) => ({ name, details: [] })) },
      { label: "4층", facilities: ["화학·에너지융합학부 교수실 / 실험실", "중앙기기실", "중앙실험지원센터"].map((name) => ({ name, details: [] })) },
      { label: "3층", facilities: ["바이오신약의과학부 교수실 / 실험실"].map((name) => ({ name, details: [] })) },
      { label: "2층", facilities: ["바이오신약의과학부 교수실 / 실험실"].map((name) => ({ name, details: [] })) },
      { label: "1층", facilities: ["복식박물관"].map((name) => ({ name, details: [] })) },
      { label: "B1", facilities: ["자연사박물관", "박물관운영팀", "학생휴게실", "복사실", "편의점"].map((name) => ({ name, details: [] })) },
      { label: "B2", facilities: ["주차장"].map((name) => ({ name, details: [] })) },
      { label: "B3", facilities: ["주차장"].map((name) => ({ name, details: [] })) }
    ]
  },
  b: {
    parentName: "B동",
    items: [
      { label: "7층", facilities: ["총장실", "부총장실", "처장실", "대회의원실", "소회의실"].map((name) => ({ name, details: [] })) },
      { label: "6층", facilities: ["의류산업학과 실습실", "교수실"].map((name) => ({ name, details: [] })) },
      { label: "5층", facilities: ["의류산업학과 실습실", "강의실", "창의융합라운지"].map((name) => ({ name, details: [] })) },
      { label: "4층", facilities: ["의류산업학과 실습실", "강의실"].map((name) => ({ name, details: [] })) },
      { label: "3층", facilities: ["자연과학대학장실 / 공과대학장실", "사회복지학과 교수실 / 실습실", "외국인교원연구실", "대학원강의실"].map((name) => ({ name, details: [] })) },
      { label: "2층", facilities: ["생활산업대학장실", "소비자산업학과 교수실 / 실습실", "한국문화콘텐츠 실습실", "기초과학연구소"].map((name) => ({ name, details: [] })) },
      { label: "1층", facilities: ["운정캠퍼스통합지원팀", "성신건강관리팀", "통합우편센터", "바이오신약의과학부 실험실"].map((name) => ({ name, details: [] })) },
      { label: "B1", facilities: ["학생회실", "동아리실", "사물함실", "전시실 3", "전시실 4"].map((name) => ({ name, details: [] })) },
      { label: "B2", facilities: ["주차장"].map((name) => ({ name, details: [] })) },
      { label: "B3", facilities: ["주차장"].map((name) => ({ name, details: [] })) }
    ]
  },
  c: {
    parentName: "C동",
    items: [
      { label: "7층", facilities: ["간호대학장실", "간호학교수실", "강의실"].map((name) => ({ name, details: [] })) },
      { label: "6층", facilities: ["간호학과 교수실 / 실습실", "바이오식품공학과 / 뷰티산업학과 실습실", "향장미용연구실"].map((name) => ({ name, details: [] })) },
      { label: "5층", facilities: ["SWANS Center"].map((name) => ({ name, details: [] })) },
      { label: "4층", facilities: ["청정신소재공학과 실험실", "교수실"].map((name) => ({ name, details: [] })) },
      { label: "3층", facilities: ["원형강의실", "강의실"].map((name) => ({ name, details: [] })) },
      { label: "2층", facilities: ["교강사휴게실", "강의실"].map((name) => ({ name, details: [] })) },
      { label: "1층", facilities: ["중강당", "소강당"].map((name) => ({ name, details: [] })) },
      { label: "B1", facilities: ["글로벌라운지", "자율PC실", "전산교육실", "방음실기실", "마루연습실", "카페", "강의실"].map((name) => ({ name, details: [] })) },
      { label: "B2", facilities: ["무용예술학과 실기실"].map((name) => ({ name, details: [] })) },
      { label: "B3", facilities: ["미디어영상연기학과 실기실", "Brickwall Sound"].map((name) => ({ name, details: [] })) }
    ]
  },
  library: {
    parentName: "파빌리온동 도서관",
    items: [
      {
        label: "3층",
        facilities: [
          {
            name: "자유열람실",
            details: ["이용시간: 평일 09:00~19:00 (방학 중 17:00까지)"]
          },
          {
            name: "노트북열람실",
            details: ["이용시간: 연중무휴 06:00~23:30"]
          },
          {
            name: "시설 안내",
            details: ["멀티미디어자료·DVD 감상실", "스터디실(6인실, 8인실, 12인실)", "수면실"]
          }
        ]
      },
      {
        label: "4층",
        facilities: [
          {
            name: "대출·반납실",
            details: ["이용시간: 평일 09:00~19:00 (방학 중 17:00까지)", "도서 대출·반납"]
          },
          {
            name: "도서자료실",
            details: ["이용시간: 평일 09:00~19:00 (방학 중 17:00까지)", "운정캠퍼스 관련 학과 전공도서(동서·양서) 및 문학자료"]
          },
          {
            name: "이용 지원",
            details: ["인터넷 및 문서편집 PC(국회도서관·국립중앙도서관 자료 검색)", "프린트 및 스캔"]
          }
        ]
      },
      {
        label: "5층",
        facilities: [
          {
            name: "집중열람실",
            details: ["이용시간: 연중무휴 06:00~23:30", "236석(좌석배정기 이용)"]
          }
        ]
      }
    ]
  },
  facility: {
    parentName: "편의시설",
    items: [
      {
        label: "편의점",
        facilities: [
          {
            name: "편의점(e-mart24) · B동 지하 1층 128호",
            details: [
              "운영시간: 무인시스템으로 24시간 운영 (야간·공휴일 출입 시 카드 인증 필요)",
              "전화번호: 070-4779-2727"
            ]
          }
        ]
      },
      {
        label: "복사실",
        facilities: [
          {
            name: "복사실 · B동 지하 1층 129호",
            details: [
              "운영시간: 학기 중 09:00~18:00 / 방학 중 휴무 (계절학기만 이용 가능)",
              "전화번호: 920-2637"
            ]
          }
        ]
      },
      {
        label: "성신건강관리팀",
        facilities: [
          {
            name: "성신건강관리팀",
            details: [
              "성신건강관리팀에서 제공하는 모든 의료서비스는 무료입니다."
            ],
            detailSections: [
              {
                title: "위치 및 문의",
                items: ["운정캠퍼스 B동 110호", "02-920-2641, 02-920-2642"]
              },
              {
                title: "이용시간",
                items: ["학기 중 09:00~17:00", "방학 중 09:00~17:00", "점심시간 12:00~13:00", "토·일요일 휴무"]
              },
              {
                title: "이용 서비스",
                items: [
                  "응급처치 및 간이투약",
                  "건강상담 및 온라인 건강상담(공개/비공개)",
                  "건강교육: 월 1~2회 심폐소생술, 성교육 등 다양한 주제로 실시",
                  "학생 건강검사: 1학년과 외국인 학생 대상",
                  "교직원 종합검진",
                  "수시 건강검사: 키, 체중, 혈압, 혈당, 혈색소 등",
                  "안정실: 질병이나 생리통 등으로 인해 안정이 필요할 때 이용 가능",
                  "모유수유실: 모유 유축 및 보관 가능",
                  "감염병 예방 및 관리: 교내 식당 위생점검, 감염병 예방 교육",
                  "지정병원 관련 업무: 고려대학교 안암병원, 한양대학교병원"
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  food: {
    parentName: "식당/카페",
    items: [
      {
        label: "식당",
        facilities: [
          {
            name: "교내식당 · P동 10층",
            details: [
              "주메뉴: 단품메뉴, 한식, 일품, 특선, 스낵, 즉석요리",
              "이용시간: 학기 중 평일 11:00~15:00 (토·일 휴무)",
              "이용시간: 방학 중 평일 11:00~14:00 (토·일 휴무)",
              "전화번호: 920-2638"
            ]
          }
        ]
      },
      {
        label: "카페",
        facilities: [
          {
            name: "커피전문점(블루포트) · B동 지하 1층 로비",
            details: [
              "운영시간: 학기 중 평일 08:00~17:00 / 방학 중 평일 10:00~15:00 (토·일 휴무)",
              "전화번호: 920-2644"
            ]
          },
          {
            name: "베이커리(더베이크) · P동 10층",
            details: [
              "운영시간: 학기 중 평일 08:00~20:00, 토요일 09:00~18:00 / 방학 중 평일 09:00~16:00 (토·일 휴무)",
              "전화번호: 980-3060"
            ]
          }
        ]
      }
    ]
  }
};

export const campusBuildingDetails: Record<string, CampusBuildingDetail> = {
  student: {
    parentName: "학생회관",
    items: [
      {
        label: "1층",
        facilities: ["장애학생지원센터", "사물함실", "소극장", "동아리실"].map((name) => ({ name, details: [] }))
      },
      {
        label: "2층",
        facilities: ["총학생회실", "단과대학생회실", "세미나실", "동아리실", "학생복지위원회", "셀프카페테리아"].map((name) => ({ name, details: [] }))
      },
      {
        label: "3층",
        facilities: ["기도실", "동아리실", "세미나실", "셀프카페테리아"].map((name) => ({ name, details: [] }))
      },
      {
        label: "4층",
        facilities: ["통합동아리실(준·신규동아리)", "성신학보사", "셀프카페테리아(파우더룸)"].map((name) => ({ name, details: [] }))
      },
      {
        label: "5층",
        facilities: ["성신체인지봉사단", "FORUS", "성신교육방송국", "성신미러사"].map((name) => ({ name, details: [] }))
      }
    ]
  },
  facility: {
    parentName: "편의시설",
    items: [
      {
        label: "난초방 · 수정관 1층",
        facilities: [
          {
            name: "편의점(e-mart24)",
            details: ["전화번호: 070-4779-2727", "운영시간: 06:00~24:00 (무인시스템 운영, 야간·공휴일 출입 시 카드 인증 필요)"]
          },
          {
            name: "꽃집(Mari)",
            details: ["전화번호: 920-7930", "운영시간: 학기 중 평일 10:00~17:00 / 방학 중 평일 10:00~16:00 (토·일 휴무)"]
          },
          {
            name: "기념품점",
            details: ["전화번호: 920-7489", "운영시간: 학기 중 평일 10:00~17:00 / 방학 중 평일 10:00~15:00 (토·일 휴무)"]
          },
          {
            name: "베이커리(CLUB 1847)",
            details: ["전화번호: 6229-9063", "운영시간: 학기 중 평일 08:00~20:00 / 방학 중 평일 08:00~15:00 (토·일 휴무)"]
          },
          {
            name: "버거ING",
            details: ["전화번호: 920-7989", "운영시간: 학기 중 평일 10:00~18:00 / 방학 중 평일 10:00~17:00 (토·일 휴무)"]
          }
        ]
      },
      {
        label: "복사실 · 수정관 A동 1층 113호",
        facilities: [
          {
            name: "복사실",
            details: ["전화번호: 920-7497", "운영시간: 학기 중 평일 08:30~18:00 / 방학 중 평일 10:00~17:00 (토·일 휴무)"]
          }
        ]
      },
      {
        label: "성신휘트니스센터",
        facilities: [
          {
            name: "성신휘트니스센터",
            details: ["유산소·무산소 운동기구와 PT, 필라테스 등 다양한 운동 프로그램을 제공합니다."],
            detailSections: [
              {
                title: "시설 및 프로그램",
                items: [
                  "유산소 운동기구: 천국의 계단 2대, 트레드밀 13대, 사이클 외 9대",
                  "무산소 운동기구: 머신 23대, 프리웨이트 존, 덤벨 존",
                  "특별 프로그램: 1:1 PT, 그룹 PT, 그룹 필라테스, 케틀벨 등 다양한 GX 프로그램"
                ]
              },
              {
                title: "회비",
                items: [
                  "성신 구성원 1개월 회원권: 25,000원",
                  "성신 구성원의 직계 가족(여성), 졸업생 등도 구성원 가격으로 등록 가능",
                  "외부인(여성) 1개월 회원권: 50,000원",
                  "학생 PT: 1회 40,000원",
                  "매니저 PT: 1회 50,000원",
                  "그룹 PT 등 기타 등록에 관한 내용은 센터로 문의"
                ]
              },
              {
                title: "등록기간",
                items: ["매월 1일부터 20일까지 접수 가능"]
              },
              {
                title: "출입 시 지참물",
                items: [
                  "휘트니스센터 내 운동화 필수 착용(슬리퍼, 크록스, 맨발 등 불가)",
                  "수건은 1인당 하루 2장 무료 제공"
                ]
              },
              {
                title: "문의처",
                items: ["휘트니스센터: 02-920-2288", "인사총무팀: 02-920-7071"]
              }
            ]
          }
        ]
      },
      {
        label: "성신건강관리팀",
        facilities: [
          {
            name: "성신건강관리팀",
            details: [
              "성신건강관리팀에서 제공하는 모든 의료서비스는 무료입니다."
            ],
            detailSections: [
              {
                title: "위치 및 문의",
                items: ["수정캠퍼스 행정관 301호", "02-920-7341, 02-920-7342"]
              },
              {
                title: "이용시간",
                items: ["학기 중 09:00~17:00", "방학 중 09:00~17:00", "점심시간 12:00~13:00", "토·일요일 휴무"]
              },
              {
                title: "이용 서비스",
                items: [
                  "응급처치 및 간이투약",
                  "건강상담 및 온라인 건강상담(공개/비공개)",
                  "건강교육: 월 1~2회 심폐소생술, 성교육 등 다양한 주제로 실시",
                  "학생 건강검사: 1학년과 외국인 학생 대상",
                  "교직원 종합검진",
                  "수시 건강검사: 키, 체중, 혈압, 혈당, 혈색소 등",
                  "안정실: 질병이나 생리통 등으로 인해 안정이 필요할 때 이용 가능",
                  "모유수유실: 모유 유축 및 보관 가능",
                  "감염병 예방 및 관리: 교내 식당 위생점검, 감염병 예방 교육",
                  "지정병원 관련 업무: 고려대학교 안암병원, 한양대학교병원"
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  food: {
    parentName: "식당/카페",
    items: [
      {
        label: "식당",
        facilities: [
          {
            name: "교내식당 1 · 수정관 A동 10층",
            details: [
              "주메뉴: 백반(1식 5찬)",
              "운영시간: 학기 중 평일 11:00~13:30, 17:00~18:30 / 방학 중 평일 11:00~13:30",
              "전화번호: 920-7430"
            ]
          },
          {
            name: "교내식당 2 · 난향관 3층",
            details: [
              "주메뉴: 푸드코트 형식 운영(일품요리) – 덮밥, 비빔밥, 돈가스, 면류, 국밥 및 찌개 등",
              "운영시간: 학기 중 10:00~19:30 / 방학 중 10:00~15:00",
              "전화번호: 920-7393"
            ],
            menuSections: [
              {
                name: "바비든돈",
                items: [
                  "바비돈돈 · 3,900원", "참치마요 · 3,500원", "치킨마요 · 3,900원", "스팸마요덮밥 · 3,900원",
                  "라볶이 · 5,900원", "라볶이+김주먹밥 · 8,700원", "라볶이+날치알 주먹밥 · 9,300원",
                  "푸팟퐁커리볶음밥 · 5,900원", "김치스팸볶음밥 · 5,900원", "김주먹밥 · 3,300원",
                  "날치알주먹밥 · 3,900원", "라면+김주먹밥 · 6,600원", "라면+날치알주먹밥 · 7,200원",
                  "라면(계란 없음) · 3,800원", "계란라면 · 4,500원", "치즈라면 · 4,500원", "만두라면 · 4,700원", "우삼겹라면 · 5,200원"
                ]
              },
              {
                name: "푸포420",
                items: [
                  "푸포쌀국수 · 4,500원", "우삼겹쌀국수 · 5,900원", "마라쌀국수 · 6,300원", "마라우삼겹쌀국수 · 7,400원",
                  "육회비빔밥 · 5,900원", "연어비빔밥 · 6,900원", "야채비빔밥 · 4,900원", "푸포쌀국수+돈불직화 · 7,200원",
                  "우삼겹쌀국수+돈불직화 · 8,600원", "마라쌀국수+돈불직화 · 10,100원", "육회비빔밥+돈불직화 · 8,600원",
                  "육회비빔밥+돈불직화 · 10,600원", "연어비빔밥+돈불직화 · 9,600원", "야채비빔밥+돈불직화 · 7,600원"
                ]
              },
              {
                name: "감찌개",
                items: [
                  "감찌개 · 6,000원", "바지락순두부찌개 · 6,200원", "우삼겹순두부찌개 · 6,900원", "스팸순두부찌개 · 6,900원",
                  "된장찌개 · 6,000원", "바지락된장찌개 · 6,200원", "우삼겹된장찌개 · 6,500원", "김치찌개 · 6,000원",
                  "돼지김치찌개 · 6,500원", "참치김치찌개 · 6,500원", "스팸김치찌개 · 6,500원", "고기듬뿍김치찌개 · 7,500원",
                  "순대국밥 · 6,500원", "순대만국밥 · 6,500원", "고기만국밥 · 6,500원"
                ]
              },
              {
                name: "경성카츠",
                items: [
                  "경성카츠 · 5,900원", "고구마치즈돈가스 · 7,900원", "특등심왕돈가스 · 8,900원", "경성카레라이스 · 4,900원",
                  "경성치킨카레라이스 · 6,500원", "오므라이스 · 4,900원", "꼬치어묵우동 · 4,500원", "새우튀김우동 · 6,900원",
                  "경성카레돈가스 · 6,900원", "새우카레 · 6,500원"
                ]
              }
            ]
          }
        ]
      },
      {
        label: "카페",
        facilities: [
          {
            name: "커피전문점(블루포트) · 수정관 1층 로비",
            details: [
              "전화번호: 070-5180-0222",
              "운영시간: 학기 중 평일 08:00~18:00 / 방학 중 평일 09:00~16:00 (토·일 휴무)"
            ]
          },
          {
            name: "커피전문점(카페딕셔너리) · 성신관 5층 수하루 내",
            details: [
              "전화번호: 920-7493",
              "운영시간: 학기 중 평일 08:00~20:00 / 방학 중 평일 08:00~16:00 (토·일 휴무)"
            ]
          }
        ]
      }
    ]
  },
  library: {
    parentName: "중앙도서관",
    items: [
      {
        label: "1층",
        facilities: [
          { name: "대출·반납실", details: ["운영시간: 평일 09:00~19:00 (방학 중 17:00까지)", "학부 재학생은 14일간 최대 7권 대출 가능", "도서 연체 시 연체 일수만큼 대출 중지"] },
          { name: "특성화학습관", details: ["운영시간: 연중무휴 06:00~23:30", "스터디 및 휴식 공간", "프린트 이용 가능"] },
          { name: "센트럴플라자", details: ["운영시간: 연중무휴 24시간 (23:30~익일 05:00 출입 통제)", "노트북 이용 가능", "80석"] }
        ]
      },
      {
        label: "2층",
        facilities: [
          { name: "멀티미디어스튜디오", details: ["운영시간: 토요일·일요일·공휴일 휴실 / 06:00~23:30", "42석(좌석배정기 이용)"] },
          { name: "전자정보실", details: ["운영시간: 토요일·일요일·공휴일 휴실 / 06:00~23:30", "비도서 및 전자자료 관내 대출 가능"] },
          { name: "크리에이티브스튜디오", details: ["운영시간: 평일 09:00~19:00 (방학 중 17:00까지)", "촬영 및 편집 가능"] },
          { name: "서양서·문학자료실", details: ["운영시간: 평일 09:00~19:00 (방학 중 17:00까지)", "전 주제 분야의 서양서 비치"] }
        ]
      },
      {
        label: "3층",
        facilities: [
          { name: "집중·개인열람실", details: ["운영시간: 연중무휴 24시간 (23:30~익일 05:00 출입 통제)", "집중열람석 70석(좌석배정기 이용)", "개인열람석 5석(좌석배정기 이용)"] },
          { name: "인문과학자료실", details: ["운영시간: 평일 09:00~19:00 (방학 중 17:00까지)", "Human Science 자료"] }
        ]
      },
      {
        label: "4층",
        facilities: [
          { name: "그룹스터디룸", details: ["운영시간: 연중무휴 06:00~23:30", "6인실 8실(디베이팅스퀘어): 예약 후 이용", "12인실 1실(프레젠테이션스퀘어): 예약 후 이용"] },
          { name: "사회과학자료 제1실", details: ["운영시간: 평일 09:00~19:00 (방학 중 17:00까지)", "Social Science 1 자료"] }
        ]
      },
      {
        label: "5층",
        facilities: [
          { name: "그룹스터디룸", details: ["운영시간: 연중무휴 06:00~23:30", "6인실 4실(디베이팅스퀘어): 예약 후 이용", "8인실 4실(콜라보레이션라운지): 오픈형, 예약 후 이용"] },
          { name: "사회과학자료 제2실", details: ["운영시간: 평일 09:00~19:00 (방학 중 17:00까지)", "Social Science 2 자료"] }
        ]
      },
      {
        label: "6층",
        facilities: [
          { name: "그룹스터디룸", details: ["운영시간: 연중무휴 06:00~23:30", "6인실 4실(디베이팅스퀘어): 예약 후 이용", "6인실 4실(이노베이션라운지): 오픈형, 예약 후 이용"] },
          { name: "자연과학자료실", details: ["운영시간: 평일 09:00~19:00 (방학 중 17:00까지)", "Natural & Technology 자료"] }
        ]
      },
      {
        label: "7층",
        facilities: [
          { name: "크리스탈라운지", details: ["운영시간: 연중무휴 06:00~23:30", "60석"] },
          { name: "역사예술자료실", details: ["운영시간: 평일 09:00~19:00 (방학 중 17:00까지)", "History & Arts 자료"] }
        ]
      }
    ]
  },
  sungshin: {
    parentName: "성신관",
    items: [
      { label: "10F", facilities: ["교수연구실", "다목적회의실", "로컬디자인정책연구소"].map((name) => ({ name, details: [] })) },
      { label: "9F", facilities: ["대외협력부총장실", "교수연구실", "사회과학대학장실", "대학 교학팀(제2교학팀)", "문서고"].map((name) => ({ name, details: [] })) },
      { label: "8F", facilities: ["통합대학원장실", "대학원 학과실", "대학원(강의실/원우회)", "대학원 교학팀", "대학 교학팀(제2교학팀)", "대·소회의실"].map((name) => ({ name, details: [] })) },
      {
        label: "7F",
        facilities: [
          { name: "강의실", details: [] },
          { name: "대학원전용열람실", details: ["운영시간: 연중무휴 06:00~23:30", "48석(대학원생, 박사 및 강사 전용 열람실)"] },
          { name: "반주학과실습실", details: [] },
          { name: "음악치료전공실", details: [] }
        ]
      },
      { label: "6F", facilities: ["교육혁신원장실", "교수학습지원팀", "교육과정혁신팀", "교육성과관리팀", "스튜디오", "MOOC 스튜디오", "셀프 스튜디오", "스마트클래스룸", "FL 클래스룸", "성신스터디룸", "수업행동분석실", "미디어강의실", "발전전략실"].map((name) => ({ name, details: [] })) },
      { label: "5F", facilities: ["수정마루", "상담마루", "수하루", "강의실"].map((name) => ({ name, details: [] })) },
      { label: "4F", facilities: ["성신역사관", "관악실습실", "타악기실", "현악실습실", "녹음실", "실습실", "관현악합주실", "피아노앙상블실", "오케스트라릿? · 합창실"].map((name) => ({ name, details: [] })) },
      { label: "3F", facilities: [{ name: "강의실", details: [] }] },
      {
        label: "2F",
        facilities: [
          { name: "성신관련열람실 · 서고", details: ["성신관열람실 운영시간: 연중무휴 06:00~23:30", "85석"] },
          { name: "강의실", details: [] }
        ]
      },
      { label: "1F", facilities: ["학생지원팀", "학사운영팀", "연산기획평가팀", "연산지원팀", "창의융합 교학팀", "국제교류지원팀", "국제교육원", "회의실", "학생생활민원상담실", "대형강의실"].map((name) => ({ name, details: [] })) },
      { label: "B1·2", facilities: [{ name: "주차장", details: [] }] }
    ]
  },
  sujeong: {
    parentName: "수정관",
    items: [
      { label: "C동 10F", facilities: ["교수연구실", "유아교육실습실"].map((name) => ({ name, details: [] })) },
      { label: "C동 9F", facilities: ["사범대학장실", "교육문제연구소", "교수연구실"].map((name) => ({ name, details: [] })) },
      { label: "C동 8F", facilities: ["강의실", "다매체강의실", "교수연구실"].map((name) => ({ name, details: [] })) },
      { label: "C동 7F", facilities: [{ name: "강의실", details: [] }] },
      { label: "C동 6F", facilities: ["강의실", "서예실습실"].map((name) => ({ name, details: [] })) },
      { label: "C동 5F", facilities: [{ name: "사범대교육과정자료실", details: [] }] },
      { label: "C동 4F", facilities: [{ name: "강의실", details: [] }] },
      { label: "B동 10F", facilities: ["교수연구실", "인문대 세미나실"].map((name) => ({ name, details: [] })) },
      { label: "B동 9F", facilities: ["교수연구실", "인문융합예술대학장실"].map((name) => ({ name, details: [] })) },
      { label: "B동 8F", facilities: [{ name: "교수연구실", details: [] }] },
      { label: "B동 7F", facilities: ["인문과학연구소", "글로벌서울연구소", "동아시아연구소", "인문과학대학 자료실", "인문과학대학 실습실"].map((name) => ({ name, details: [] })) },
      { label: "B동 6F", facilities: ["사회과대학원", "지리학과대학원 실습실(심리학과·지리학과·사회학과)"].map((name) => ({ name, details: [] })) },
      {
        label: "B동 5F",
        facilities: [
          { name: "IT융합대학장실", details: [] },
          { name: "생활산업대학장실", details: [] },
          { name: "공과대학장실", details: [] },
          { name: "자연과학대학장실", details: [] },
          { name: "수정관 열람실", details: ["운영시간: 연중무휴 06:00~23:30", "62석(좌석배정기 이용)", "그룹스터디룸(디베이팅스퀘어) 10인실 2실: 예약 후 이용", "스마트라커 120개"] },
          { name: "교강사 라운지", details: [] }
        ]
      },
      { label: "A동 10F", facilities: [{ name: "교내식당 1", details: [] }] },
      { label: "A동 9F", facilities: [{ name: "교수연구실", details: [] }] },
      { label: "A동 8F", facilities: [{ name: "교수연구실", details: [] }] },
      { label: "A동 7F", facilities: [{ name: "교수연구실", details: [] }] },
      { label: "A동 6F", facilities: ["수학과실습실", "통계학과실습실"].map((name) => ({ name, details: [] })) },
      { label: "A동 5F", facilities: [{ name: "대학교학팀(제3교학팀)", details: [] }] },
      { label: "공통 4F", facilities: ["강의실", "대강당", "중강당", "소강당", "컴퓨터공학과 / AI융합학부 / 연구실 / 실험실", "교수연구실", "교수회의실"].map((name) => ({ name, details: [] })) },
      { label: "공통 3F", facilities: ["창의융합라운지(창의융합대학장실)", "국제교육원 운영팀", "한국어과정강의실", "대학교학팀(제1교학팀)", "스포츠과학부 / AI융합학부 실습실"].map((name) => ({ name, details: [] })) },
      { label: "공통 2F", facilities: ["강의실", "IT운영팀", "인재개발팀", "현장실습운영팀", "진로취업처장실", "주차관리실"].map((name) => ({ name, details: [] })) },
      { label: "공통 1F", facilities: ["대학일자리플러스센터", "청년고용거버넌스팀", "국민취업지원 운영센터", "전시실", "Job café", "매점", "S-nap zone", "복사실"].map((name) => ({ name, details: [] })) },
      { label: "공통 B1", facilities: ["관리실", "전기실", "기계실", "전기/기계감시실", "주차장"].map((name) => ({ name, details: [] })) },
      { label: "공통 B2", facilities: [{ name: "주차장", details: [] }] }
    ]
  }
};
