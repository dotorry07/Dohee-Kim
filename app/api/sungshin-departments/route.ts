import { NextRequest, NextResponse } from "next/server";
import { sungshinDepartments } from "@/lib/sungshin-departments";

export async function GET(request: NextRequest) {
  const query = normalize(request.nextUrl.searchParams.get("q") || "");
  const departments = [...sungshinDepartments];
  const filteredDepartments = query
    ? departments.filter((department) => normalize(department).includes(query))
    : departments;

  return NextResponse.json({
    departments: filteredDepartments,
    totalCount: departments.length,
    filteredCount: filteredDepartments.length,
    source: "sungshin-undergraduate-list"
  });
}

function normalize(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}
