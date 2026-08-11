"use client";

export type BannerTagIconName =
  | "calendar"
  | "checklist"
  | "scholarship"
  | "party"
  | "briefcase"
  | "pin"
  | "chat"
  | "building"
  | "bulb"
  | "write"
  | "like"
  | "star"
  | "phone"
  | "clock"
  | "edit"
  | "map"
  | "search"
  | "coffee"
  | "walk"
  | "user"
  | "lock"
  | "bell"
  | "logout";

export function BannerTagIcon({ icon }: { icon: BannerTagIconName }) {
  return (
    <span className="banner-tag-icon" aria-hidden="true">
      <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24" width="16">
        {icon === "calendar" ? <><path d="M7 4.5v3M17 4.5v3M5 8.5h14M6 6h12a1.5 1.5 0 0 1 1.5 1.5v11H4.5v-11A1.5 1.5 0 0 1 6 6Z" /><path d="M8 12.5h2M14 12.5h2M8 16h2" /></> : null}
        {icon === "checklist" ? <><path d="M6 5.5h12v13H6z" /><path d="m8.5 10 1.2 1.2 2.2-2.5M14 10h2.2M8.5 15l1.2 1.2 2.2-2.5M14 15h2.2" /></> : null}
        {icon === "scholarship" ? <><path d="m4 9 8-4 8 4-8 4z" /><path d="M7 11.2v3.2c1.6 1.8 8.4 1.8 10 0v-3.2" /><path d="M20 9v5" /></> : null}
        {icon === "party" ? <><path d="m6 18 4.5-12 7.5 7.5z" /><path d="M12.8 5.7c1.8-.9 3.2-.7 4.2.7M15.5 8.5c1.9-.5 3.1 0 3.8 1.4M8.8 11.2l3.9 3.9" /></> : null}
        {icon === "briefcase" ? <><path d="M5 8h14v10H5z" /><path d="M9 8V6h6v2M5 12h14M11 12v1h2v-1" /></> : null}
        {icon === "pin" ? <><path d="M12 20s5.5-5 5.5-9.2a5.5 5.5 0 0 0-11 0C6.5 15 12 20 12 20Z" /><circle cx="12" cy="10.8" r="1.8" /></> : null}
        {icon === "chat" ? <><path d="M5 6.5h14v9H9l-4 3v-12Z" /><path d="M8.5 10h7M8.5 13h4" /></> : null}
        {icon === "building" ? <><path d="M5.5 19.5h13" /><path d="M7 19.5v-12l5-2.5 5 2.5v12" /><path d="M10 10h.1M14 10h.1M10 13h.1M14 13h.1" /></> : null}
        {icon === "bulb" ? <><path d="M9 15.5h6M10 19h4M8.2 11.7a5 5 0 1 1 7.6 0c-.8.7-1.1 1.4-1.2 2.3H9.4c-.1-.9-.4-1.6-1.2-2.3Z" /></> : null}
        {icon === "write" ? <><path d="M5 18.8h4l10-10a2.2 2.2 0 0 0-3.1-3.1l-10 10z" /><path d="m14.7 6.9 2.4 2.4" /></> : null}
        {icon === "like" ? <><path d="M7.5 11v8H5V11zM7.5 11l4.2-6.5c.8.2 1.2.9 1 1.8L12 10h5.5c1 0 1.8.9 1.6 1.9l-.9 5.1c-.2 1.2-1.2 2-2.4 2H7.5" /></> : null}
        {icon === "star" ? <path d="m12 4.5 2.1 4.2 4.6.7-3.3 3.2.8 4.6-4.2-2.2-4.2 2.2.8-4.6-3.3-3.2 4.6-.7z" /> : null}
        {icon === "phone" ? <><path d="M8 4.5h8v15H8z" /><path d="M11 17h2M10 7h4" /></> : null}
        {icon === "clock" ? <><circle cx="12" cy="12" r="7.5" /><path d="M12 8v4l2.7 1.6" /></> : null}
        {icon === "edit" ? <><path d="M5 18.8h4l9.5-9.5a2.1 2.1 0 0 0-3-3L6 15.8z" /><path d="M13.8 8 16 10.2" /></> : null}
        {icon === "map" ? <><path d="m5 7 4-2 6 2 4-2v12l-4 2-6-2-4 2z" /><path d="M9 5v12M15 7v12" /></> : null}
        {icon === "search" ? <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" /></> : null}
        {icon === "coffee" ? <><path d="M6.5 8h9v6.5a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3z" /><path d="M15.5 9.5h1.3a2.2 2.2 0 0 1 0 4.4h-1.3M7 20h9" /></> : null}
        {icon === "walk" ? <><circle cx="12" cy="5.5" r="1.7" /><path d="m11 8.2-1.8 4.2 3.3 1.6 1.8 5M12.5 9l2.7 2.5M9.8 14.4 7.2 19" /></> : null}
        {icon === "user" ? <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 19c1.2-3.5 3.4-5.2 6.5-5.2s5.3 1.7 6.5 5.2" /></> : null}
        {icon === "lock" ? <><path d="M7 10h10v9H7z" /><path d="M9.2 10V7.8a2.8 2.8 0 0 1 5.6 0V10" /><path d="M12 14v1.8" /></> : null}
        {icon === "bell" ? <><path d="M6.8 16.5h10.4l-1.1-1.7V11a4.1 4.1 0 0 0-8.2 0v3.8z" /><path d="M10.2 18.2a2 2 0 0 0 3.6 0" /></> : null}
        {icon === "logout" ? <><path d="M10 6H6.5v12H10" /><path d="M13 8.5 16.5 12 13 15.5" /><path d="M16.5 12H9.5" /></> : null}
      </svg>
    </span>
  );
}
