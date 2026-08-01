const DAY_MS = 86_400_000;

export function normalizeDate(date: Date | string) {
  const value = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function getDdayLabel(today: Date, eventDate: Date | string) {
  const difference = Math.round((normalizeDate(eventDate).getTime() - normalizeDate(today).getTime()) / DAY_MS);
  if (difference === 0) return "D-DAY";
  return difference > 0 ? `D-${difference}` : `D+${Math.abs(difference)}`;
}

export function formatKoreanDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(date);
}

export function getRelativeTime(value: string, now: Date) {
  const hours = Math.floor(Math.max(0, now.getTime() - new Date(value).getTime()) / 3_600_000);
  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}
