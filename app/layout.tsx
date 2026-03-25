import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "麻雀成績入力",
  description: "3人打ち・4人打ちの麻雀成績をGoogleスプレッドシートへ保存するアプリ",
};

const isDev = process.env.APP_ENV !== "production";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body data-env={isDev ? "dev" : "prd"}>
        {isDev && (
          <div className="pointer-events-none fixed left-1/2 top-3 z-50 -translate-x-1/2">
            <span className="rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-bold tracking-widest text-white shadow-lg">
              DEV 環境
            </span>
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
