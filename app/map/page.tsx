"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { campusPlaces } from "@/lib/data";
import type { CampusPlace } from "@/lib/types";

const categoryLabels: Record<CampusPlace["category"], string> = {
  lecture: "강의동",
  library: "도서관",
  student: "학생회관",
  food: "식당/카페",
  admin: "행정실",
  facility: "편의시설"
};

type CampusKey = "donam" | "unjeong";
type PlaceFilterKey = "all" | "student" | "nanhyang" | "sujeong" | "sungshin" | "food" | "library" | "admin" | "facility";
type DetailItem = { label: string; caption?: string };
type DetailOption = { parentName: string; items: DetailItem[] };
type DetailSection = { title: string; lines: string[] };

const placeFilters: Array<{ key: PlaceFilterKey; label: string }> = [
  { key: "all", label: "전체" },
  { key: "student", label: "학생회관" },
  { key: "nanhyang", label: "난향관" },
  { key: "sujeong", label: "수정관" },
  { key: "sungshin", label: "성신관" },
  { key: "food", label: "식당/카페" },
  { key: "library", label: "도서관" },
  { key: "admin", label: "행정실" },
  { key: "facility", label: "편의시설" }
];

function matchesPlaceFilter(place: CampusPlace, filter: PlaceFilterKey) {
  if (filter === "all") return true;
  if (filter === "student") return place.buildingName === "학생회관";
  if (filter === "nanhyang") return place.buildingName === "난향관";
  if (filter === "sujeong") return place.buildingName === "수정관";
  if (filter === "sungshin") return place.buildingName === "성신관";
  return place.category === filter;
}

function getDetailOptions(filter: PlaceFilterKey): DetailOption | null {
  if (filter === "student") {
    return { parentName: "학생회관", items: ["1층", "2층", "3층", "4층", "5층"].map((label) => ({ label })) };
  }
  if (filter === "nanhyang") {
    return { parentName: "난향관", items: ["1층", "2층", "3층", "4층", "5층", "6층", "7층", "8층"].map((label) => ({ label })) };
  }
  if (filter === "sujeong") {
    return { parentName: "수정관", items: ["1층", "2층", "3층", "4층", "5층", "6층", "7층", "8층", "9층", "10층"].map((label) => ({ label })) };
  }
  if (filter === "sungshin") {
    return { parentName: "성신관", items: ["A관", "B관", "C관"].map((label) => ({ label })) };
  }
  if (filter === "library") {
    return {
      parentName: "도서관",
      items: [
        ...["1층", "2층", "3층", "4층", "5층", "6층", "7층"].map((label) => ({ label })),
        { label: "성신관 2층", caption: "도서관" },
        { label: "성신관 7층", caption: "도서관" },
        { label: "수정관 B동 5층", caption: "도서관" }
      ]
    };
  }
  return null;
}

const detailSections: Record<string, DetailSection[]> = {
  "학생회관-1층": [
    {
      title: "층별시설",
      lines: [
        "장애학생지원센터, 사물함실, 소극장, 동아리실"
      ]
    }
  ],
  "학생회관-2층": [
    {
      title: "층별시설",
      lines: [
        "총학생회실, 단과대학생회실, 세미나실, 동아리실, 학생복지위원회, 셀프카페테리아"
      ]
    }
  ],
  "학생회관-3층": [
    {
      title: "층별시설",
      lines: [
        "기도실, 동아리실, 세미나실, 셀프카페테리아"
      ]
    }
  ],
  "학생회관-4층": [
    {
      title: "층별시설",
      lines: [
        "통합동아리실(준,신규동아리), 성신학보사, 셀프카페테리아(파우더룸)"
      ]
    }
  ],
  "학생회관-5층": [
    {
      title: "층별시설",
      lines: [
        "성신체인지봉사단, FORUS, 성신교육방송국, 성신미러사"
      ]
    }
  ],
  "도서관-1층": [
    {
      title: "대출 반납실",
      lines: [
        "평 일: 09:00∼19:00",
        "(방학중: 17:00까지)",
        "- 학부재학생: 14일간 7권 대출 가능",
        "- 도서연체시 연체일수 만큼 대출 중지"
      ]
    },
    {
      title: "특성화학습관",
      lines: [
        "연중무휴",
        "06:00∼23:30",
        "- 스터디 및 휴식 공간",
        "- 프린트"
      ]
    },
    {
      title: "센트럴플라자",
      lines: [
        "연중무휴 24시간",
        "(23:30 ~ 익일 05:00까지는 출입통제)",
        "- 노트북 이용가능",
        "- 80석"
      ]
    }
  ],
  "도서관-2층": [
    {
      title: "멀티미디어스튜디오",
      lines: [
        "토,일,공휴일 휴실",
        "06:00∼23:30",
        "- 42석(좌석배정기 이용)"
      ]
    },
    {
      title: "전자정보실",
      lines: [
        "토,일,공휴일 휴실",
        "06:00∼23:30",
        "- 비도서 및 전자자료 관내대출"
      ]
    },
    {
      title: "크리에이티브스튜디오",
      lines: [
        "평 일: 09:00∼19:00",
        "(방학중: 17:00까지)",
        "- 촬영및 편집 가능"
      ]
    },
    {
      title: "서양서/문학 자료실",
      lines: [
        "평 일: 09:00∼19:00",
        "(방학중: 17:00까지)",
        "- 전 주제분야 서양서"
      ]
    }
  ],
  "도서관-3층": [
    {
      title: "집중/개인 열람실",
      lines: [
        "연중무휴 24시간",
        "(23:30 ~ 익일 05:00까지는 출입통제)",
        "- 집중열람 70석(좌석배정기 이용)",
        "- 개인열람 5석(좌석배정기 이용)"
      ]
    },
    {
      title: "인문과학자료실",
      lines: [
        "평 일: 09:00∼19:00",
        "(방학중: 17:00까지)",
        "- Human Science"
      ]
    }
  ],
  "도서관-4층": [
    {
      title: "그룹스터디룸",
      lines: [
        "연중무휴",
        "06:00∼23:30",
        "- 6인 8실(디베이팅스퀘어) : 예약 후 이용",
        "- 12인 1실(프리젠테이션스퀘어) : 예약 후 이용"
      ]
    },
    {
      title: "사회과학자료 제1실",
      lines: [
        "평 일: 09:00∼19:00",
        "(방학중: 17:00까지)",
        "- Social Science 1"
      ]
    }
  ],
  "도서관-5층": [
    {
      title: "그룹스터디룸",
      lines: [
        "연중무휴",
        "06:00∼23:30",
        "- 6인 4실(디베이팅스퀘어) : 예약 후 이용",
        "- 8인 4실(콜라보레이션라운지) : 오픈형, 예약 후 이용"
      ]
    },
    {
      title: "사회과학자료 제2실",
      lines: [
        "평 일: 09:00∼19:00",
        "(방학중: 17:00까지)",
        "- Social Science 2"
      ]
    }
  ],
  "도서관-6층": [
    {
      title: "그룹스터디룸",
      lines: [
        "연중무휴",
        "06:00∼23:30",
        "- 6인 4실(디베이팅스퀘어) : 예약 후 이용",
        "- 6인 4실(이노베이션라운지) : 오픈형, 예약 후 이용"
      ]
    },
    {
      title: "자연과학자료실",
      lines: [
        "평 일: 09:00∼19:00",
        "(방학중: 17:00까지)",
        "- Natural &Technology"
      ]
    }
  ],
  "도서관-7층": [
    {
      title: "크리스탈라운지",
      lines: [
        "연중무휴",
        "06:00∼23:30",
        "- 60석"
      ]
    },
    {
      title: "역사예술자료실",
      lines: [
        "평 일: 09:00∼19:00",
        "(방학중: 17:00까지)",
        "- History & Arts"
      ]
    }
  ],
  "도서관-성신관 2층": [
    {
      title: "성신관열람실",
      lines: [
        "06:00∼23:30",
        "- 85석"
      ]
    }
  ],
  "도서관-성신관 7층": [
    {
      title: "대학원열람실",
      lines: [
        "06:00∼23:30",
        "- 48석(대학원 석·박사 및 강사 전용열람실)"
      ]
    }
  ],
  "도서관-수정관 B동 5층": [
    {
      title: "수정관열람실",
      lines: [
        "06:00∼23:30"
      ]
    }
  ]
};

export default function MapPage() {
  return (
    <Suspense fallback={<main className="page"><div className="panel">지도를 불러오는 중입니다.</div></main>}>
      <MapContent />
    </Suspense>
  );
}

function MapContent() {
  const searchParams = useSearchParams();
  const building = searchParams.get("building");
  const initial = campusPlaces.find((place) => building && place.buildingName.includes(building)) ?? campusPlaces[0];
  const [activeCampus, setActiveCampus] = useState<CampusKey>("donam");
  const [selected, setSelected] = useState(initial);
  const [query, setQuery] = useState(building ?? "");
  const [placeFilter, setPlaceFilter] = useState<PlaceFilterKey>("all");
  const [selectedDetailItem, setSelectedDetailItem] = useState<string | null>(null);
  const detailOptions = getDetailOptions(placeFilter);

  const filteredPlaces = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return campusPlaces.filter((place) => {
      const matchesFilter = matchesPlaceFilter(place, placeFilter);
      const matchesQuery = !normalized || [place.name, place.buildingName, place.description, ...place.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [placeFilter, query]);
  const resultCount = detailOptions ? detailOptions.items.length : filteredPlaces.length;
  const selectedDetailSections = detailOptions && selectedDetailItem
    ? detailSections[`${detailOptions.parentName}-${selectedDetailItem}`] ?? []
    : [];

  return (
    <main className="page">
      <section className="page-header">
        <h1>학교 지도</h1>
        <p>건물명, 강의실명, 편의시설명으로 검색하고 시간표와 연결된 수업 장소를 확인합니다.</p>
      </section>

      <section className="panel map-search-panel">
        <div className="campus-switch-tabs" aria-label="캠퍼스 선택">
          <button
            className={activeCampus === "donam" ? "campus-switch-tab active" : "campus-switch-tab"}
            type="button"
            onClick={() => {
              setActiveCampus("donam");
              setSelected(initial);
              setQuery(building ?? "");
              setPlaceFilter("all");
              setSelectedDetailItem(null);
            }}
          >
            돈암수정캠퍼스
          </button>
          <button
            className={activeCampus === "unjeong" ? "campus-switch-tab active" : "campus-switch-tab"}
            type="button"
            onClick={() => {
              setActiveCampus("unjeong");
              setSelected(campusPlaces[0]);
              setQuery("");
              setPlaceFilter("all");
              setSelectedDetailItem(null);
            }}
          >
            운정그린캠퍼스
          </button>
        </div>
        <div className="map-image-area">
          <div className={activeCampus === "unjeong" ? "campus-map unjeong-campus-map" : "campus-map"}>
            <span
              className="pin"
              data-label={selected.name}
              style={{ left: `${selected.mapX}%`, top: `${selected.mapY}%` }}
            />
          </div>
        </div>

        <div className="map-search-area">
          <div className="section-title">
            <h2>장소 검색</h2>
            <span className="badge">{resultCount}곳</span>
          </div>
          <div className="form">
            <input
              className="search"
              placeholder="건물, 시설, 태그 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="tabs">
              {placeFilters.map((filter) => (
                <button
                  className={placeFilter === filter.key ? "tab active" : "tab"}
                  key={filter.key}
                  type="button"
                  onClick={() => {
                    setPlaceFilter(filter.key);
                    setSelectedDetailItem(null);
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="list">
              {detailOptions ? (
                detailOptions.items.map((item) => (
                  <button
                    className={selectedDetailItem === item.label ? "list-item active" : "list-item"}
                    type="button"
                    key={`${detailOptions.parentName}-${item.label}`}
                    onClick={() => setSelectedDetailItem(item.label)}
                    style={{ textAlign: "left" }}
                  >
                    <strong>{item.label}</strong>
                    <span className="muted">{item.caption ?? detailOptions.parentName} · {item.label}</span>
                  </button>
                ))
              ) : (
                <>
                  {filteredPlaces.map((place) => (
                    <button
                      className="list-item"
                      type="button"
                      key={place.id}
                      onClick={() => setSelected(place)}
                      style={{ textAlign: "left" }}
                    >
                      <strong>{place.name}</strong>
                      <span className="muted">{categoryLabels[place.category]} · {place.buildingName} {place.floor}</span>
                    </button>
                  ))}
                  {filteredPlaces.length === 0 ? <div className="list-item">검색 결과가 없습니다.</div> : null}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="panel map-detail-panel" style={{ marginTop: 16 }}>
        {detailOptions && selectedDetailItem ? (
          <>
            <div className="section-title">
              <h2>{selectedDetailItem}</h2>
              <span className="badge">{detailOptions.parentName}</span>
            </div>
            {selectedDetailSections.length > 0 ? (
              <div className="map-detail-content">
                {selectedDetailSections.map((section) => (
                  <div className="map-detail-section" key={section.title}>
                    <strong>{section.title}</strong>
                    {section.lines.map((line) => <span key={line}>{line}</span>)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">세부사항은 추후 작성 예정입니다.</p>
            )}
          </>
        ) : (
          <>
            <div className="section-title">
              <h2>{selected.name}</h2>
              <span className="badge">{categoryLabels[selected.category]}</span>
            </div>
            <p>{selected.description}</p>
            <div className="meta">
              <span>{selected.buildingName}</span>
              <span>{selected.floor}</span>
              {selected.tags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
