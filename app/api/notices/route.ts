import { NextResponse } from "next/server";
import { notices } from "@/lib/data";
import type { Notice } from "@/lib/types";

type DepartmentNoticeCategory = "curriculum" | "graduation" | "campus" | "event";

const sungshinBaseUrl = "https://www.sungshin.ac.kr";
const sourcePageUrls = [
  `${sungshinBaseUrl}/generaledu/22036/subview.do`,
  `${sungshinBaseUrl}/humanity/11974/subview.do`
];
const competitionKeywords = ["대회", "공모", "공모전", "경진", "경연", "해커톤", "contest", "competition"];
const excludedNoticeKeywords = ["수상자 발표", "수상작 발표", "결과 발표", "선정 발표"];
const cacheTtlMs = 30 * 60 * 1000;

let competitionNoticeCache: { expiresAt: number; notices: Notice[] } | null = null;
let departmentTargetCache: { expiresAt: number; targets: { name: string; url: string }[] } | null = null;
const departmentNoticeCache = new Map<string, { expiresAt: number; notices: Notice[] }>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const category = searchParams.get("category");
  const department = searchParams.get("department");

  if (department && department !== "all") {
    const departmentNotices = await getDepartmentNotices(department);
    const items = departmentNotices
      .filter((notice) => !category || category === "all" || getDepartmentNoticeCategory(notice) === category)
      .filter((notice) => !query || `${notice.title} ${notice.summary}`.toLowerCase().includes(query))
      .sort(compareNotices);

    return NextResponse.json({ notices: items });
  }

  const competitionNotices = await getDepartmentCompetitionNotices();

  const items = [...competitionNotices, ...notices]
    .filter((notice) => !category || category === "all" || notice.category === category)
    .filter((notice) => !query || `${notice.title} ${notice.summary}`.toLowerCase().includes(query))
    .sort(compareNotices);

  return NextResponse.json({ notices: items });
}

async function getDepartmentNotices(departmentName: string) {
  const cached = departmentNoticeCache.get(departmentName);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.notices;
  }

  try {
    const departments = await getDepartmentTargets();
    const department = findDepartmentTarget(departments, departmentName);

    if (!department) {
      return [];
    }

    const scraped = await scrapeDepartmentNotices(department);
    const deduped = dedupeNotices(scraped).slice(0, 40);
    departmentNoticeCache.set(departmentName, { expiresAt: Date.now() + cacheTtlMs, notices: deduped });
    return deduped;
  } catch {
    return cached?.notices ?? [];
  }
}

async function getDepartmentCompetitionNotices() {
  if (competitionNoticeCache && competitionNoticeCache.expiresAt > Date.now()) {
    return competitionNoticeCache.notices;
  }

  try {
    const departments = await getDepartmentTargets();
    const collected = await mapWithConcurrency(departments, 6, scrapeDepartmentCompetitionNotices);
    const deduped = dedupeNotices(collected.flat()).slice(0, 30);
    competitionNoticeCache = { expiresAt: Date.now() + cacheTtlMs, notices: deduped };
    return deduped;
  } catch {
    return competitionNoticeCache?.notices ?? [];
  }
}

async function getDepartmentTargets() {
  if (departmentTargetCache && departmentTargetCache.expiresAt > Date.now()) {
    return departmentTargetCache.targets;
  }

  const sourceHtmls = await mapWithConcurrency(sourcePageUrls, 2, fetchText);
  const targets = dedupeDepartmentTargets(
    sourceHtmls.flatMap((sourceHtml) => [
      ...extractDepartmentLinks(sourceHtml),
      ...extractDepartmentNoticeLinks(sourceHtml)
    ])
  );
  departmentTargetCache = { expiresAt: Date.now() + cacheTtlMs, targets };
  return targets;
}

async function scrapeDepartmentNotices(department: { name: string; url: string }) {
  try {
    const homeHtml = await fetchText(department.url);
    const noticeListUrls = await findNoticeListUrls(homeHtml, department.url);
    const listHtmls = await mapWithConcurrency(noticeListUrls.slice(0, 3), 2, fetchText);
    const articles = dedupeArticles(listHtmls.flatMap((html) => extractArticles(html))).slice(0, 40);

    return articles.map<Notice>((article) => ({
      id: `dept-notice-${department.name}-${article.url}`.replace(/\s+/g, "-"),
      category: getNoticeCategoryFromDepartmentCategory(getDepartmentArticleCategory(article.title)),
      title: article.title,
      summary: `${department.name} 공식 사이트 공지사항에서 가져온 ${getDepartmentCategoryLabel(getDepartmentArticleCategory(article.title))} 공지입니다.`,
      sourceUrl: article.url,
      isPinned: false,
      publishedAt: article.date ? `${article.date.replace(/\./g, "-")}T09:00:00.000Z` : new Date().toISOString(),
      createdAt: new Date().toISOString()
    }));
  } catch {
    return [];
  }
}

async function scrapeDepartmentCompetitionNotices(department: { name: string; url: string }) {
  try {
    const homeHtml = await fetchText(department.url);
    const noticeListUrls = await findNoticeListUrls(homeHtml, department.url);
    const listHtmls = await mapWithConcurrency(noticeListUrls.slice(0, 2), 2, fetchText);
    const articles = listHtmls.flatMap((html) => extractArticles(html));

    const competitionArticles = articles
      .filter((article) => isCompetitionNotice(article.title))
      .filter((article) => !isExcludedNotice(article.title))
      .slice(0, 8);
    const articlesWithDetails = await mapWithConcurrency(competitionArticles, 4, addArticleDetails);

    return articlesWithDetails
      .filter((article) => article.applicationUrl)
      .map<Notice>((article) => ({
        id: `dept-competition-${department.name}-${article.url}`.replace(/\s+/g, "-"),
        category: "event",
        title: article.title,
        summary: `${department.name} 공지사항에서 가져온 대회/공모 관련 공지입니다.`,
        imageUrl: article.imageUrl,
        applicationUrl: article.applicationUrl,
        applicationDeadline: article.applicationDeadline,
        isExpired: article.applicationDeadline ? isPastDeadline(article.applicationDeadline) : false,
        sourceUrl: article.url,
        isPinned: false,
        publishedAt: article.date ? `${article.date.replace(/\./g, "-")}T09:00:00.000Z` : new Date().toISOString(),
        createdAt: new Date().toISOString()
      }));
  } catch {
    return [];
  }
}

function findDepartmentTarget(items: { name: string; url: string }[], departmentName: string) {
  const normalizedDepartmentName = normalizeDepartmentName(departmentName);

  return items.find((item) => normalizeDepartmentName(item.name) === normalizedDepartmentName) ??
    items.find((item) => (
      normalizeDepartmentName(item.name).includes(normalizedDepartmentName) ||
      normalizedDepartmentName.includes(normalizeDepartmentName(item.name))
    ));
}

function extractDepartmentLinks(html: string) {
  const departmentLinks: { name: string; url: string }[] = [];
  const seen = new Set<string>();
  const tableStart = html.indexOf("자유 계열별 진입 가능 학과");
  const targetHtml = tableStart >= 0 ? html.slice(tableStart) : html;
  const linkPattern = /<td[^>]*>((?:(?!<\/td>)[\s\S])*?)<a\s+href="([^"]*(?:\/sites\/[^"]+|\/[^"]+)\/index\.do)"[^>]*>/g;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(targetHtml)) !== null) {
    const name = cleanText(match[1]).replace(/^.*?([가-힣A-Za-z·&]+(?:학과|학부))$/, "$1");
    const href = match[2];

    if (!name || !/(학과|학부)$/.test(name) || seen.has(href)) {
      continue;
    }

    seen.add(href);
    departmentLinks.push({ name, url: toAbsoluteUrl(href) });
  }

  return departmentLinks;
}

function extractDepartmentNoticeLinks(html: string) {
  const departmentLinks: { name: string; url: string }[] = [];
  const seen = new Set<string>();
  const noticePattern = /([가-힣A-Za-zㆍ·&]+(?:학과|학부))\s*공지사항[\s\S]{0,300}?<a\s+href="([^"]+\/subview\.do)"/g;
  let match: RegExpExecArray | null;

  while ((match = noticePattern.exec(html)) !== null) {
    const name = cleanText(match[1]).replace(/ㆍ/g, "·");
    const href = match[2];

    if (!name || seen.has(href)) {
      continue;
    }

    seen.add(href);
    departmentLinks.push({ name, url: toAbsoluteUrl(href) });
  }

  return departmentLinks;
}

function dedupeDepartmentTargets(items: { name: string; url: string }[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.url;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function findNoticeListUrls(homeHtml: string, departmentUrl: string) {
  const urls = new Set<string>();
  const bbsPattern = /href="([^"]*\/bbs\/[^"]+\/artclList\.do[^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = bbsPattern.exec(homeHtml)) !== null) {
    const context = cleanText(homeHtml.slice(Math.max(0, match.index - 300), match.index + 300));
    if (context.includes("공지")) {
      urls.add(toAbsoluteUrl(match[1]));
    }
  }

  if (urls.size > 0) {
    return [...urls];
  }

  const subviewUrls = extractNoticeSubviewUrls(homeHtml, departmentUrl).slice(0, 3);
  const subviewHtmls = await mapWithConcurrency(subviewUrls, 2, fetchText);

  subviewHtmls.forEach((html) => {
    let subviewMatch: RegExpExecArray | null;
    while ((subviewMatch = bbsPattern.exec(html)) !== null) {
      urls.add(toAbsoluteUrl(subviewMatch[1]));
    }
  });

  return [...urls];
}

function extractNoticeSubviewUrls(html: string, departmentUrl: string) {
  const urls: string[] = [];
  const seen = new Set<string>();
  const sitePath = new URL(departmentUrl).pathname.split("/").filter(Boolean)[0];
  const subviewPattern = new RegExp(`<a\\s+[^>]*href="([^"]*\\/${sitePath}\\/[^"]+\\/subview\\.do)"[\\s\\S]{0,900}?<input[^>]+value="([^"]*공지[^"]*)"`, "g");
  let match: RegExpExecArray | null;

  while ((match = subviewPattern.exec(html)) !== null) {
    const label = cleanText(match[2]);
    if (!label.includes("공지")) {
      continue;
    }

    const url = toAbsoluteUrl(match[1]);
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  return urls;
}

function extractArticles(html: string) {
  const articles: DepartmentArticle[] = [];
  const rowPattern = /<tr[\s\S]*?<\/tr>/g;
  const linkPattern = /<a[^>]+href="([^"]*\/bbs\/[^"]+\/artclView\.do[^"]*)"[^>]*class="[^"]*artclLinkView[^"]*"[^>]*>([\s\S]*?)<\/a>/;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const row = rowMatch[0];
    const linkMatch = row.match(linkPattern);

    if (!linkMatch) {
      continue;
    }

    const dateMatch = row.match(/<td[^>]+class="[^"]*_artclTdRdate[^"]*"[^>]*>([\s\S]*?)<\/td>/);
    const titleHtml = linkMatch[2].match(/<strong[^>]*>([\s\S]*?)<\/strong>/)?.[1] ?? linkMatch[2];
    articles.push({
      title: cleanText(titleHtml).replace(/\s*새글$/, ""),
      url: toAbsoluteUrl(linkMatch[1]),
      date: cleanText(dateMatch?.[1] ?? "")
    });
  }

  return articles;
}

type DepartmentArticle = {
  title: string;
  url: string;
  date: string;
  imageUrl?: string;
  applicationUrl?: string;
  applicationDeadline?: string;
};

async function addArticleDetails(article: DepartmentArticle) {
  try {
    const html = await fetchText(article.url);
    const bodyHtml = extractNoticeBodyHtml(html);
    const bodyText = cleanText(bodyHtml);
    const links = extractLinks(bodyHtml, article.url);
    const applicationLink = findApplicationLink(links);
    const applicationDeadline =
      applicationLink ? extractApplicationDeadline(applicationLink.context, article.date) : undefined;

    return {
      ...article,
      imageUrl: extractNoticeImageUrl(bodyHtml, article.url),
      applicationUrl: applicationLink?.url,
      applicationDeadline: applicationDeadline ?? extractApplicationDeadline(bodyText, article.date)
    };
  } catch {
    return article;
  }
}

function extractNoticeBodyHtml(html: string) {
  const bodyMatch =
    html.match(/<div[^>]+class="[^"]*\bartclView\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ??
    html.match(/<(?:div|section)[^>]+class="[^"]*(?:view|content)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)>/i);

  return bodyMatch?.[1] ?? html;
}

function extractNoticeImageUrl(html: string, pageUrl: string) {
  const imagePattern = /<img\b[^>]*(?:src|data-src|data-original)=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = imagePattern.exec(html)) !== null) {
    const src = match[1].replace(/&amp;/g, "&").trim();

    if (!src || src.startsWith("data:") || isDecorativeImage(src)) {
      continue;
    }

    return toMediaUrl(src, pageUrl);
  }

  return undefined;
}

function findApplicationLink(links: { url: string; text: string; context: string }[]) {
  const applicationLink = links.find((link) => isApplicationLink(link.url, link.text, link.context));

  if (applicationLink) {
    return applicationLink;
  }

  return links.find((link) => isExternalFormUrl(link.url));
}

function extractLinks(html: string, pageUrl: string) {
  const links: { url: string; text: string; context: string }[] = [];
  const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1].replace(/&amp;/g, "&").trim();

    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }

    const start = Math.max(0, match.index - 120);
    const end = Math.min(html.length, match.index + match[0].length + 120);
    links.push({
      url: new URL(href, pageUrl).toString(),
      text: cleanText(match[2]),
      context: cleanText(html.slice(start, end))
    });
  }

  return links;
}

function isApplicationLink(url: string, text: string, context: string) {
  const value = `${url} ${text} ${context}`.toLowerCase();
  const hasApplicationWord = /신청|접수|지원|참가|apply|application|form/.test(value);

  return hasApplicationWord && (isExternalFormUrl(url) || !url.includes("/artclView.do"));
}

function isExternalFormUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    return (
      hostname.includes("forms.gle") ||
      hostname.includes("docs.google.com") ||
      hostname.includes("form.office.com") ||
      hostname.includes("naver.com")
    );
  } catch {
    return false;
  }
}

function extractApplicationDeadline(text: string, articleDate: string) {
  const currentYear = new Date().getFullYear();
  const articleYear = Number(articleDate.match(/^(\d{4})/)?.[1]) || currentYear;
  const chunks = text
    .split(/(?=마감|신청|접수|제출|기간|까지)/)
    .filter((chunk) => /마감|신청|접수|제출|기간|까지/.test(chunk));
  const candidates = chunks.flatMap((chunk) => extractDates(chunk, articleYear));
  const uniqueCandidates = [...new Set(candidates)];

  if (uniqueCandidates.length === 0) {
    return undefined;
  }

  return uniqueCandidates.sort((a, b) => Date.parse(a) - Date.parse(b))[0];
}

function extractDates(text: string, defaultYear: number) {
  const dates: string[] = [];
  const fullDatePattern = /(\d{4})\s*[년.]\s*(\d{1,2})\s*[월.]\s*(\d{1,2})\s*일?/g;
  const shortDatePattern = /(?<!\d)(\d{1,2})\s*[월.]\s*(\d{1,2})\s*일?/g;
  let match: RegExpExecArray | null;

  while ((match = fullDatePattern.exec(text)) !== null) {
    dates.push(toDeadlineIso(Number(match[1]), Number(match[2]), Number(match[3])));
  }

  while ((match = shortDatePattern.exec(text)) !== null) {
    const previous = text.slice(Math.max(0, match.index - 6), match.index);
    if (/\d{4}\s*[년.]?\s*$/.test(previous)) {
      continue;
    }
    dates.push(toDeadlineIso(defaultYear, Number(match[1]), Number(match[2])));
  }

  return dates;
}

function toDeadlineIso(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 14, 59, 59, 999)).toISOString();
}

function isPastDeadline(deadline: string) {
  return Date.now() > Date.parse(deadline);
}

function isDecorativeImage(src: string) {
  return (
    /(?:blank|spacer|loading|icon|btn|logo|word_image)\.(?:gif|png|jpe?g|svg)/i.test(src) ||
    /fonts\.gstatic\.com\/s\/e\/notoemoji/i.test(src)
  );
}

function toMediaUrl(url: string, pageUrl: string) {
  const mediaUrl = new URL(url, pageUrl);

  if (mediaUrl.hostname.endsWith("sungshin.ac.kr")) {
    mediaUrl.protocol = "https:";
  }

  return mediaUrl.toString();
}

function isCompetitionNotice(title: string) {
  const normalized = title.toLowerCase();
  return competitionKeywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function isExcludedNotice(title: string) {
  return excludedNoticeKeywords.some((keyword) => title.includes(keyword));
}

function compareNotices(a: Notice, b: Notice) {
  return (
    Number(b.isPinned) - Number(a.isPinned) ||
    Number(Boolean(a.isExpired)) - Number(Boolean(b.isExpired)) ||
    Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
  );
}

function dedupeNotices(items: Notice[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.sourceUrl || item.title;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeArticles(items: DepartmentArticle[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.url || item.title;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getDepartmentNoticeCategory(notice: Notice): DepartmentNoticeCategory {
  return getDepartmentArticleCategory(`${notice.title} ${notice.summary}`);
}

function getDepartmentArticleCategory(text: string): DepartmentNoticeCategory {
  const normalized = text.toLowerCase();

  if (/(졸업|학위|논문|캡스톤|인증|이수인증|졸업요건|졸업시험)/.test(normalized)) {
    return "graduation";
  }

  if (/(교육과정|교과|전공|수강|이수|교직|강의|수업|커리큘럼|교과목|교직과정)/.test(normalized)) {
    return "curriculum";
  }

  if (/(행사|특강|세미나|설명회|대회|공모|공모전|경진|박람회|워크숍|워크샵|간담회|모집|프로그램)/.test(normalized)) {
    return "event";
  }

  return "campus";
}

function getNoticeCategoryFromDepartmentCategory(category: DepartmentNoticeCategory): Notice["category"] {
  if (category === "event") {
    return "event";
  }

  if (category === "curriculum" || category === "graduation") {
    return "academic";
  }

  return "general";
}

function getDepartmentCategoryLabel(category: DepartmentNoticeCategory) {
  const labels: Record<DepartmentNoticeCategory, string> = {
    curriculum: "교육과정",
    graduation: "졸업",
    campus: "교내공지",
    event: "행사"
  };

  return labels[category];
}

function normalizeDepartmentName(value: string) {
  return value
    .replace(/ㆍ/g, "·")
    .replace(/\s+/g, "")
    .replace(/전공$/, "학과")
    .trim();
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += concurrency) {
    const chunk = items.slice(index, index + concurrency);
    results.push(...await Promise.all(chunk.map(mapper)));
  }

  return results;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "text/html,application/xhtml+xml"
    },
    next: { revalidate: 1800 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return response.text();
}

function toAbsoluteUrl(url: string) {
  return new URL(url.replace(/&amp;/g, "&"), sungshinBaseUrl).toString();
}

function cleanText(value: string) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}
