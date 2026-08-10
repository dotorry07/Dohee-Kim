"use client";

import { Suspense, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { campusBuildingDetails, unjeongCampusBuildingDetails } from "@/lib/campus-place-details";
import { campusPlaces } from "@/lib/data";
import type { CampusPlace } from "@/lib/types";
import type { CampusBuildingDetail, CampusFacilityDetail, CampusFloorDetail } from "@/lib/campus-place-details";

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

type CampusKey = CampusPlace["campus"];
type PlaceFilterKey = "all" | "student" | "nanhyang" | "sujeong" | "sungshin" | "p" | "a" | "b" | "c" | "food" | "library" | "admin" | "facility";
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

function getDetailOptions(campus: CampusKey, filter: PlaceFilterKey): CampusBuildingDetail | null {
  if (filter === "all" || filter === "admin") {
    return null;
  }

  if (campus === "donam" && filter === "nanhyang") {
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

  return campus === "donam"
    ? campusBuildingDetails[filter] ?? null
    : unjeongCampusBuildingDetails[filter] ?? null;
}

function getInitialDetailLabel(detailOptions: CampusBuildingDetail | null, target: string | null) {
  if (!detailOptions?.items.length) {
    return "";
  }

  if (target === "수정관10층") {
    return detailOptions.items.find((item) => item.label.includes("10"))?.label ?? detailOptions.items[0].label;
  }

  if (target === "P동10층") {
    return detailOptions.items.find((item) => item.label.includes("10"))?.label ?? detailOptions.items[0].label;
  }

  return detailOptions.items[0].label;
}

function getCampusFromParams(campus: string | null, location: string | null): CampusKey {
  return campus === "운정" || location?.startsWith("운정캠_") ? "unjeong" : "donam";
}

function getTargetLocation(target: string | null) {
  if (target === "수정관10층") return "수정관";
  if (target === "P동10층") return "P동";
  return "";
}

function getDetailLocationText(detailOptions: CampusBuildingDetail, item: CampusFloorDetail) {
  const facilityLocations = item.facilities
    .map((facility) => facility.name.split(" · ")[1]?.trim())
    .filter(Boolean);

  if (facilityLocations.length > 0) {
    return Array.from(new Set(facilityLocations)).join(" · ");
  }

  return `${detailOptions.parentName} ${item.label}`;
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
  const location = searchParams.get("location");
  const category = searchParams.get("category");
  const campus = searchParams.get("campus");
  const target = searchParams.get("target");
  const initialCampus = getCampusFromParams(campus, location);
  const initialQuery = getTargetLocation(target) || location?.replace(/^(수정캠|운정캠)_/, "") || building || "";
  const [activeCampus, setActiveCampus] = useState<CampusKey>(initialCampus);
  const [query, setQuery] = useState(initialQuery);
  const [placeFilter, setPlaceFilter] = useState<PlaceFilterKey>(category === "food" || category === "식당" ? "food" : "all");
  const detailOptions = getDetailOptions(activeCampus, placeFilter);
  const [selectedDetailLabel, setSelectedDetailLabel] = useState(() => getInitialDetailLabel(detailOptions, target));
  const [selectedSujeongGroup, setSelectedSujeongGroup] = useState<SujeongBuildingGroup | null>(null);
  const visiblePlaceFilters = activeCampus === "donam"
    ? placeFilters
    : [
        placeFilters[0],
        ...unjeongBuildingFilters,
        ...placeFilters.filter((filter) => ["food", "library", "facility"].includes(filter.key))
      ];

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

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(() => {
    const initial = filteredPlaces[0] ?? campusPlaces.find((place) => place.campus === initialCampus) ?? null;
    return initial?.id ?? null;
  });
  const selected = campusPlaces.find((place) => place.id === selectedPlaceId && place.campus === activeCampus)
    ?? filteredPlaces[0]
    ?? campusPlaces.find((place) => place.campus === activeCampus)
    ?? null;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredDetailItems = useMemo(() => {

    if (!detailOptions) {
      return [];
    }

    if (!normalizedQuery) {
      return detailOptions.items;
    }

    return detailOptions.items.filter((item) => (
      [
        detailOptions.parentName,
        item.label,
        ...item.facilities.flatMap((facility) => [
          facility.name,
          ...facility.details,
          ...(facility.detailSections?.flatMap((section) => [section.title, ...section.items]) ?? []),
          ...(facility.menuSections?.flatMap((section) => [section.name, ...section.items]) ?? [])
        ])
      ].join(" ").toLowerCase().includes(normalizedQuery)
    ));
  }, [detailOptions, normalizedQuery]);
  const showSujeongGroupList = placeFilter === "sujeong" && !selectedSujeongGroup && !normalizedQuery;
  const visibleDetailItems = placeFilter === "sujeong" && selectedSujeongGroup && !normalizedQuery
    ? filteredDetailItems.filter((item) => item.label.startsWith(`${selectedSujeongGroup} `))
    : filteredDetailItems;
  const selectedDetail = showSujeongGroupList
    ? null
    : visibleDetailItems.find((item) => item.label === selectedDetailLabel)
      ?? visibleDetailItems[0]
      ?? null;
  const resultCount = showSujeongGroupList
    ? sujeongBuildingGroups.length
    : detailOptions ? visibleDetailItems.length : filteredPlaces.length;

  function changeCampus(nextCampus: CampusKey) {
    setActiveCampus(nextCampus);
    setQuery("");
    setPlaceFilter("all");
    setSelectedDetailLabel("");
    setSelectedSujeongGroup(null);
    setSelectedPlaceId(campusPlaces.find((place) => place.campus === nextCampus)?.id ?? null);
  }

  function changePlaceFilter(nextFilter: PlaceFilterKey) {
    const nextDetailOptions = getDetailOptions(activeCampus, nextFilter);
    setPlaceFilter(nextFilter);
    setSelectedSujeongGroup(null);
    setSelectedDetailLabel(nextFilter === "sujeong" ? "" : getInitialDetailLabel(nextDetailOptions, target));
    const matchingPlace = campusPlaces.find((place) => place.campus === activeCampus && matchesPlaceFilter(place, nextFilter));
    setSelectedPlaceId(matchingPlace?.id ?? null);
  }

  function changeQuery(nextQuery: string) {
    setQuery(nextQuery);
    setSelectedDetailLabel("");
    if (nextQuery.trim()) {
      setSelectedSujeongGroup(null);
    }
  }

  function selectSujeongGroup(group: SujeongBuildingGroup) {
    setSelectedSujeongGroup(group);
    const firstInGroup = detailOptions?.items.find((item) => item.label.startsWith(`${group} `));
    setSelectedDetailLabel(firstInGroup?.label ?? "");
  }

  return (
    <main className="page">
      <section className="page-header map-page-header">
        <h1>학교 지도</h1>
        <p>건물명, 강의실명, 편의시설명으로 검색하고 시간표와 연결된 수업 장소를 확인합니다.</p>
      </section>

      <section className="panel map-search-panel">
        <div className="campus-switch-tabs" aria-label="캠퍼스 선택">
          <button className={activeCampus === "donam" ? "campus-switch-tab active" : "campus-switch-tab"} type="button" onClick={() => changeCampus("donam")}>돈암수정캠퍼스</button>
          <button className={activeCampus === "unjeong" ? "campus-switch-tab active" : "campus-switch-tab"} type="button" onClick={() => changeCampus("unjeong")}>운정그린캠퍼스</button>
        </div>
        <div className="map-image-area">
          <CampusMap
            campus={activeCampus}
            places={campusPlaces}
            selectedPlaceId={selected?.id ?? null}
            onSelectPlace={(place) => setSelectedPlaceId(place.id)}
          />
        </div>
        <div className="map-search-area">
          <div className="section-title">
            <h2>장소 검색</h2>
            <span className="badge">{detailOptions ? `${resultCount}개 구역` : `${resultCount}곳`}</span>
          </div>
          <div className="form">
            <input className="search" placeholder="건물, 시설, 태그 검색" value={query} onChange={(event) => changeQuery(event.target.value)} />
            <div className="tabs">
              {visiblePlaceFilters.map((filter) => (
                <button
                  className={placeFilter === filter.key ? "tab active" : "tab"}
                  key={filter.key}
                  type="button"
                  onClick={() => changePlaceFilter(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="list">
              {detailOptions ? (
                showSujeongGroupList ? (
                  sujeongBuildingGroups.map((group) => (
                    <button
                      className="list-item"
                      type="button"
                      key={`sujeong-${group}`}
                      onClick={() => selectSujeongGroup(group)}
                      style={{ textAlign: "left" }}
                    >
                      <strong>{group}</strong>
                      <span className="muted">수정관 {group}</span>
                    </button>
                  ))
                ) : (
                  <>
                    {placeFilter === "sujeong" && selectedSujeongGroup && !normalizedQuery ? (
                      <button
                        className="list-item"
                        type="button"
                        onClick={() => {
                          setSelectedSujeongGroup(null);
                          setSelectedDetailLabel("");
                        }}
                        style={{ textAlign: "left" }}
                      >
                        <strong>동 선택으로</strong>
                      </button>
                    ) : null}
                    {visibleDetailItems.map((item) => (
                      <button
                        className={selectedDetail?.label === item.label ? "list-item active" : "list-item"}
                        type="button"
                        key={`${detailOptions.parentName}-${item.label}`}
                        onClick={() => setSelectedDetailLabel(item.label)}
                        style={{ textAlign: "left" }}
                      >
                        <strong>{item.label}</strong>
                        <span className="muted">{getDetailLocationText(detailOptions, item)}</span>
                      </button>
                    ))}
                    {visibleDetailItems.length === 0 ? <div className="list-item">검색 결과가 없습니다.</div> : null}
                  </>
                )
              ) : (
                <>
                  {filteredPlaces.map((place) => (
                    <button
                      className={selected?.id === place.id ? "list-item active" : "list-item"}
                      type="button"
                      key={place.id}
                      onClick={() => setSelectedPlaceId(place.id)}
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

      {selectedDetail && detailOptions ? (
        <section className="panel map-detail-panel" style={{ marginTop: 16 }}>
          <div className="section-title">
            <h2>{detailOptions.parentName} {selectedDetail.label}</h2>
            <span className="badge">시설 안내</span>
          </div>
          <CampusFloorDetailView floor={selectedDetail} />
        </section>
      ) : selected ? (
        <section className="panel map-detail-panel" style={{ marginTop: 16 }}>
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
        </section>
      ) : null}
    </main>
  );
}

function CampusFloorDetailView({ floor }: { floor: CampusFloorDetail }) {
  return (
    <div className="map-detail-content">
      <div className="section-title">
        <h3>{floor.label}</h3>
        <span className="badge">{floor.facilities.length}개 시설</span>
      </div>
      {floor.facilities.map((facility) => <CampusFacilityDetailView facility={facility} key={facility.name} />)}
    </div>
  );
}

function CampusFacilityDetailView({ facility }: { facility: CampusFacilityDetail }) {
  return (
    <div className="map-detail-section">
      <strong>{facility.name}</strong>
      {facility.details.map((detail) => <span key={detail}>{detail}</span>)}
      {facility.detailSections?.map((section) => (
        <div className="facility-detail-section" key={section.title}>
          <h3>{section.title}</h3>
          <ul>
            {section.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ))}
      {facility.menuSections ? <CampusMenuGroups sections={facility.menuSections} /> : null}
    </div>
  );
}

function CampusMenuGroups({ sections }: { sections: NonNullable<CampusFacilityDetail["menuSections"]> }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="facility-menu-panel">
      <div className="facility-menu-prompt">
        <span>메뉴 보기를 누르면 메뉴가 나옵니다</span>
        <button
          aria-expanded={isOpen}
          className="facility-menu-toggle"
          type="button"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? "메뉴 접기" : "메뉴 보기"}
        </button>
      </div>
      {isOpen ? (
        <div className="facility-menu-groups">
          {sections.map((section) => (
            <section className="facility-menu-group" key={section.name}>
              <h3>{section.name}</h3>
              <ul>
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
