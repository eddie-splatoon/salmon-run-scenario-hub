import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { Toaster } from "sonner";

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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

