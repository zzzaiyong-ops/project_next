import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SSGLIVE · 인플루언서 마케팅 허브",
  description: "SSGLIVE v2.1 - 인플루언서 마케팅 캠페인 관리 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
