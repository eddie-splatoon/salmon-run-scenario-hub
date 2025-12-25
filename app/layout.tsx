import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AdBanner from "./components/AdBanner";
import { Toaster } from "sonner";
import ThemeProvider from "./components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "Salmon Run Scenario Hub",
  description: "リザルト画像をアップするだけで、AIが自動解析してサーモンランのシナリオコードを生成・共有できるサービス",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col bg-gray-900 text-gray-100">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          {/* 広告バナー（フッターの上） */}
          <section className="py-8 bg-gray-800 border-t border-gray-700">
            <div className="container mx-auto px-4">
              <AdBanner size="leaderboard" adId="footer-top-ad" className="mx-auto" />
            </div>
          </section>
          <Footer />
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}

