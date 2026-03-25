import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "麻雀成績入力",
  description: "3人打ち・4人打ちの麻雀成績をGoogleスプレッドシートへ保存するアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
