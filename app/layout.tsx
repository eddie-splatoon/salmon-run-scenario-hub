import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

export const metadata: Metadata = {
  title: "Salmon Run Scenario Hub",
  description: "Salmon Run Scenario Hub",
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
      </body>
    </html>
  );
}

