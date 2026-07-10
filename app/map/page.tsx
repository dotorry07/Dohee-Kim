"use client";

import { useMemo, useState } from "react";
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

export default function MapPage() {
  const searchParams = useSearchParams();
  const building = searchParams.get("building");
  const initial = campusPlaces.find((place) => building && place.buildingName.includes(building)) ?? campusPlaces[0];
  const [selected, setSelected] = useState(initial);
  const [query, setQuery] = useState(building ?? "");
  const [category, setCategory] = useState<CampusPlace["category"] | "all">("all");

  const filteredPlaces = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return campusPlaces.filter((place) => {
      const matchesCategory = category === "all" || place.category === category;
      const matchesQuery = !normalized || [place.name, place.buildingName, place.description, ...place.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <main className="page">
      <section className="page-header">
        <h1>학교 지도</h1>
        <p>건물명, 강의실명, 편의시설명으로 검색하고 시간표와 연결된 수업 장소를 확인합니다.</p>
      </section>

      <section className="grid two">
        <article className="panel">
          <div className="campus-map">
            <span
              className="pin"
              data-label={selected.name}
              style={{ left: `${selected.mapX}%`, top: `${selected.mapY}%` }}
            />
          </div>
        </article>

        <article className="panel">
          <div className="section-title">
            <h2>장소 검색</h2>
            <span className="badge">{filteredPlaces.length}곳</span>
          </div>
          <div className="form">
            <input
              className="search"
              placeholder="건물, 시설, 태그 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="tabs">
              <button className={category === "all" ? "tab active" : "tab"} type="button" onClick={() => setCategory("all")}>전체</button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <button
                  className={category === key ? "tab active" : "tab"}
                  key={key}
                  type="button"
                  onClick={() => setCategory(key as CampusPlace["category"])}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="list">
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
            </div>
          </div>
        </article>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
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
    </main>
  );
}
