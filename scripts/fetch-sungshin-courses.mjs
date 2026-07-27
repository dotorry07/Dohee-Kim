import { writeFile } from "node:fs/promises";
import path from "node:path";

const endpoint = "https://sugang.sungshin.ac.kr/findBCRM02010Main.do";
const terms = [
  { term: "2023-1", yy: "2023", semCd: "COMM063.10" },
  { term: "2023-summer", yy: "2023", semCd: "COMM063.15" },
  { term: "2023-2", yy: "2023", semCd: "COMM063.20" },
  { term: "2023-winter", yy: "2023", semCd: "COMM063.25" },
  { term: "2024-1", yy: "2024", semCd: "COMM063.10" },
  { term: "2024-summer", yy: "2024", semCd: "COMM063.15" },
  { term: "2024-2", yy: "2024", semCd: "COMM063.20" },
  { term: "2024-winter", yy: "2024", semCd: "COMM063.25" },
  { term: "2025-1", yy: "2025", semCd: "COMM063.10" },
  { term: "2025-summer", yy: "2025", semCd: "COMM063.15" },
  { term: "2025-2", yy: "2025", semCd: "COMM063.20" },
  { term: "2025-winter", yy: "2025", semCd: "COMM063.25" },
  { term: "2026-1", yy: "2026", semCd: "COMM063.10" },
  { term: "2026-summer", yy: "2026", semCd: "COMM063.15" }
];

function asText(value) {
  return String(value ?? "").trim();
}

function mapCourse(course, term, index) {
  return {
    id: `${term}-${asText(course.sbjNo)}-${asText(course.dvcls)}-${index}`,
    term,
    departmentName: asText(course.opDptmjrNm),
    courseCode: asText(course.sbjNo),
    courseName: asText(course.sbjNm),
    classNumber: asText(course.dvcls),
    completionType: asText(course.cpdivNm),
    credits: asText(course.cdtHcnt),
    scheduleText: asText(course.tmtblKorDsc),
    roomText: asText(course.roomKorDsc),
    professorName: asText(course.empNm || course.profDsc || course.profKorDsc),
    campusName: asText(course.cmpCdNm),
    lessonTypeName: asText(course.lesnTypNm || course.lesnTypEnm)
  };
}

async function fetchTerm({ term, yy, semCd }) {
  const body = new URLSearchParams({
    yy,
    semCd,
    orgClsfCd: "",
    sbjMngCd: "",
    objCrsCd: "USSR001.10",
    dptMjrCd: "",
    sbjNoNm: "",
    cpdivCd: "",
    cmpCd: "",
    sbjAreaCd: "",
    charSbjAreaCd: ""
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "req-protocol": "urlencoded",
      "res-protocol": "json"
    },
    body
  });

  if (!response.ok) {
    throw new Error(`${term} request failed with ${response.status}`);
  }

  const rawCourses = await response.json();

  if (!Array.isArray(rawCourses)) {
    throw new Error(`${term} response was not an array`);
  }

  return rawCourses.map((course, index) => mapCourse(course, term, index));
}

function renderDatabase(courses) {
  return `export interface StoredSungshinCourse {
  id: string;
  term: string;
  departmentName: string;
  courseCode: string;
  courseName: string;
  classNumber: string;
  completionType: string;
  credits: string;
  scheduleText: string;
  roomText: string;
  professorName: string;
  campusName: string;
  lessonTypeName: string;
}

export const localSungshinTerms = ${JSON.stringify(terms.map((item) => item.term), null, 2)} as const;

export const localSungshinCourses: StoredSungshinCourse[] = ${JSON.stringify(courses, null, 2)};

export function hasLocalSungshinTerm(term: string) {
  return localSungshinTerms.includes(term as (typeof localSungshinTerms)[number]);
}

export function getLocalSungshinCourses(term: string) {
  return localSungshinCourses.filter((course) => course.term === term);
}
`;
}

const allCourses = [];

for (const termItem of terms) {
  const courses = await fetchTerm(termItem);
  allCourses.push(...courses);
  console.log(`${termItem.term}: ${courses.length}`);
}

const outputPath = path.join(process.cwd(), "lib", "sungshin-course-db.ts");
await writeFile(outputPath, renderDatabase(allCourses));
console.log(`total: ${allCourses.length}`);
console.log(outputPath);
