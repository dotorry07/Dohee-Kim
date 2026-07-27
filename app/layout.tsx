import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "새내기 ON",
  description: "성신여자대학교 신입생을 위한 시간표, 지도, 공지, 커뮤니티 서비스",
  icons: {
    icon: "/images/app-logo.png",
    shortcut: "/images/app-logo.png",
    apple: "/images/app-logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="app-shell">
          <AppHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
