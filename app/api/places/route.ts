import { NextResponse } from "next/server";
import { campusPlaces } from "@/lib/data";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const category = searchParams.get("category");

  const places = campusPlaces.filter((place) => {
    const matchesCategory = !category || category === "all" || place.category === category;
    const matchesQuery = !query || [place.name, place.buildingName, place.description, ...place.tags]
      .join(" ")
      .toLowerCase()
      .includes(query);
    return matchesCategory && matchesQuery;
  });

  return NextResponse.json({ places });
}
