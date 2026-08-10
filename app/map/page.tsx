"use client";

import { Suspense, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { campusPlaces } from "@/lib/data";
import { campusBuildingDetails, unjeongCampusBuildingDetails } from "@/lib/campus-place-details";
import type { CampusBuildingDetail } from "@/lib/campus-place-details";
import type { CampusPlace } from "@/lib/types";

const CampusMap = dynamic(() => import("@/components/CampusMap"), {
  ssr: false,
  loading: () => <div className="leaflet-campus-map map-loading">지도를 불러오는 중입니다.</div>
});

const categoryLabels: Record<CampusPlace["category"], string> = {
  lecture: "강의동",
  library: "도서관",
  student: "학생회관",
  food: "식당/카페",
  admin: "기타",
  facility: "편의시설"
};

type CampusKey = "donam" | "unjeong";
type PlaceFilterKey = "all" | "student" | "nanhyang" | "sujeong" | "sungshin" | "p" | "a" | "b" | "c" | "food" | "library" | "facility";
type SujeongBuildingGroup = "공통" | "A동" | "B동" | "C동";

const sujeongBuildingGroups: SujeongBuildingGroup[] = ["공통", "A동", "B동", "C동"];

const placeFilters: Array<{ key: PlaceFilterKey; label: string }> = [
  { key: "all", label: "전체" },
  { key: "student", label: "학생회관" },
  { key: "nanhyang", label: "난향관" },
  { key: "sujeong", label: "수정관" },
  { key: "sungshin", label: "성신관" },
  { key: "food", label: "식당/카페" },
  { key: "library", label: "도서관" },
  { key: "facility", label: "편의시설" }
];

const unjeongBuildingFilters: Array<{ key: PlaceFilterKey; label: string }> = [
  { key: "p", label: "P동" },
  { key: "a", label: "A동" },
  { key: "b", label: "B동" },
  { key: "c", label: "C동" }
];

function matchesPlaceFilter(place: CampusPlace, filter: PlaceFilterKey) {
  if (filter === "all") return true;
  if (filter === "student") return place.buildingName === "학생회관";
  if (filter === "nanhyang") return place.buildingName === "난향관";
  if (filter === "sujeong") return place.buildingName === "수정관";
  if (filter === "sungshin") return place.buildingName === "성신관";
  if (["p", "a", "b", "c"].includes(filter)) return place.buildingName === `${filter.toUpperCase()}동`;
  return place.category === filter;
}

function getDetailOptions(filter: PlaceFilterKey): CampusBuildingDetail | null {
  if (filter === "nanhyang") {
    return {
      parentName: "난향관",
      items: [
        { label: "8F", facilities: [{ name: "강의실", details: [] }] },
        { label: "7F", facilities: [{ name: "강의실", details: [] }] },
        { label: "6F", facilities: [{ name: "강의실", details: [] }] },
        { label: "5F", facilities: [{ name: "학생생활상담소", details: [] }] },
        { label: "4F", facilities: ["다독적홀", "종합상황실"].map((name) => ({ name, details: [] })) },
        { label: "3F", facilities: [{ name: "교내식당 2", details: [] }] },
        { label: "2F", facilities: [] },
        { label: "1F", facilities: [] }
      ]
    };
  }
  return campusBuildingDetails[filter] ?? null;
}

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
  const initial = campusPlaces.find((place) => place.campus === "donam" && building && place.buildingName.includes(building))
    ?? campusPlaces.find((place) => place.campus === "donam")
    ?? null;
  const [activeCampus, setActiveCampus] = useState<CampusKey>("donam");
  const [selected, setSelected] = useState<CampusPlace | null>(initial);
  const [query, setQuery] = useState(building ?? "");
  const [placeFilter, setPlaceFilter] = useState<PlaceFilterKey>("all");
  const [selectedDetailItem, setSelectedDetailItem] = useState<string | null>(null);
  const [selectedSujeongGroup, setSelectedSujeongGroup] = useState<SujeongBuildingGroup | null>(null);
  const visiblePlaceFilters = activeCampus === "donam"
    ? placeFilters
    : [
        placeFilters[0],
        ...unjeongBuildingFilters,
        ...placeFilters.filter((filter) => ["food", "library", "facility"].includes(filter.key))
      ];
  const detailOptions = activeCampus === "donam"
    ? getDetailOptions(placeFilter)
    : unjeongCampusBuildingDetails[placeFilter] ?? null;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredDetailItems = detailOptions?.items.filter((item) => {
    if (!normalizedQuery) return true;
    return [
      detailOptions.parentName,
      item.label,
      ...item.facilities.flatMap((facility) => [
        facility.name,
        ...facility.details,
        ...(facility.detailSections?.flatMap((section) => [section.title, ...section.items]) ?? []),
        ...(facility.menuSections?.flatMap((section) => [section.name, ...section.items]) ?? [])
      ])
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  }) ?? [];
  const visibleDetailItems = placeFilter === "sujeong" && selectedSujeongGroup && !normalizedQuery
    ? filteredDetailItems.filter((item) => item.label.startsWith(`${selectedSujeongGroup} `))
    : filteredDetailItems;
  const selectedDetail = detailOptions?.items.find((item) => item.label === selectedDetailItem) ?? null;

  const filteredPlaces = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return campusPlaces.filter((place) => {
      const matchesCampus = place.campus === activeCampus;
      const matchesFilter = matchesPlaceFilter(place, placeFilter);
      const matchesQuery = !normalized || [place.name, place.buildingName, place.description, ...place.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      return matchesCampus && matchesFilter && matchesQuery;
    });
  }, [activeCampus, placeFilter, query]);
  const showSujeongGroupList = placeFilter === "sujeong" && !selectedSujeongGroup && !normalizedQuery;
  const resultCount = showSujeongGroupList
    ? sujeongBuildingGroups.length
    : detailOptions ? visibleDetailItems.length : filteredPlaces.length;

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
              setSelectedSujeongGroup(null);
            }}
          >
            돈암수정캠퍼스
          </button>
          <button
            className={activeCampus === "unjeong" ? "campus-switch-tab active" : "campus-switch-tab"}
            type="button"
            onClick={() => {
              setActiveCampus("unjeong");
              setSelected(campusPlaces.find((place) => place.campus === "unjeong") ?? null);
              setQuery("");
              setPlaceFilter("all");
              setSelectedDetailItem(null);
              setSelectedSujeongGroup(null);
            }}
          >
            운정그린캠퍼스
          </button>
        </div>
        <div className="map-image-area">
          <CampusMap
            campus={activeCampus}
            places={campusPlaces}
            selectedPlaceId={selected?.id ?? null}
            onSelectPlace={setSelected}
          />
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
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedDetailItem(null);
                if (event.target.value.trim()) setSelectedSujeongGroup(null);
              }}
            />
            <div className="tabs">
              {visiblePlaceFilters.map((filter) => (
                <button
                  className={placeFilter === filter.key ? "tab active" : "tab"}
                  key={filter.key}
                  type="button"
                  onClick={() => {
                    setPlaceFilter(filter.key);
                    setSelectedDetailItem(null);
                    setSelectedSujeongGroup(null);
                    const matchingPlace = campusPlaces.find((place) => place.campus === activeCampus && matchesPlaceFilter(place, filter.key));
                    if (matchingPlace) setSelected(matchingPlace);
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="list">
              {detailOptions ? (
                showSujeongGroupList ? sujeongBuildingGroups.map((group) => (
                  <button
                    className="list-item"
                    type="button"
                    key={`sujeong-${group}`}
                    onClick={() => setSelectedSujeongGroup(group)}
                    style={{ textAlign: "left" }}
                  >
                    <strong>{group}</strong>
                    <span className="muted">수정관 {group} 층별 안내</span>
                  </button>
                )) : [
                  ...(placeFilter === "sujeong" && selectedSujeongGroup && !normalizedQuery ? [
                    <button
                      className="list-item"
                      type="button"
                      key="sujeong-group-back"
                      onClick={() => {
                        setSelectedSujeongGroup(null);
                        setSelectedDetailItem(null);
                      }}
                      style={{ textAlign: "left" }}
                    >
                      <strong>← 동 선택으로</strong>
                      <span className="muted">공통 · A동 · B동 · C동</span>
                    </button>
                  ] : []),
                  ...visibleDetailItems.map((item) => (
                  <button
                    className={selectedDetailItem === item.label ? "list-item active" : "list-item"}
                    type="button"
                    key={`${detailOptions.parentName}-${item.label}`}
                    onClick={() => setSelectedDetailItem(item.label)}
                    style={{ textAlign: "left" }}
                  >
                    <strong>{item.label}</strong>
                    <span className="muted">{detailOptions.parentName} · {item.label}</span>
                  </button>
                  )),
                  ...(visibleDetailItems.length === 0 ? [<div className="list-item" key="empty-detail-result">검색 결과가 없습니다.</div>] : [])
                ]
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

      {selectedDetail && detailOptions ? <section className="panel map-detail-panel" style={{ marginTop: 16 }}>
        <div className="section-title">
          <h2>{detailOptions.parentName} {selectedDetail.label}</h2>
          <span className="badge">시설 안내</span>
        </div>
        {selectedDetail.facilities.length > 0 ? selectedDetail.facilities.map((facility) => facility.menuSections ? (
          <div className="list-item" key={facility.name} style={{ marginTop: 12 }}>
            <strong>{facility.name}</strong>
            {facility.details.map((detail) => <span className="muted" key={detail}>{detail}</span>)}
            {facility.detailSections?.map((section) => (
              <div className="facility-detail-section" key={section.title}>
                <h3>{section.title}</h3>
                <ul>
                  {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
            <details style={{ marginTop: 8 }}>
              <summary><strong>메뉴 및 가격 보기</strong></summary>
              {facility.menuSections.map((section) => (
                <div key={section.name} style={{ marginTop: 12 }}>
                  <strong>{section.name}</strong>
                  <div className="meta" style={{ marginTop: 8 }}>
                    {section.items.map((item) => <span className="chip" key={`${section.name}-${item}`}>{item}</span>)}
                  </div>
                </div>
              ))}
            </details>
          </div>
        ) : (
          <div className="list-item" key={facility.name} style={{ marginTop: 12 }}>
            <strong>{facility.name}</strong>
            {facility.details.map((detail) => <span className="muted" key={detail}>{detail}</span>)}
            {facility.detailSections?.map((section) => (
              <div className="facility-detail-section" key={section.title}>
                <h3>{section.title}</h3>
                <ul>
                  {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )) : <p className="muted">상세 정보가 준비 중입니다.</p>}
      </section> : selected ? <section className="panel map-detail-panel" style={{ marginTop: 16 }}>
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
      </section> : null}
    </main>
  );
}
