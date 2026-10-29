import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "KhetSe — Agricultural Harvest Logistics Coordination Platform",
  description:
    "Software-only harvest-to-market logistics coordination, dynamic recovery planning, and modeled counterfactual analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white text-khet-ink antialiased">
        <Header />
        <main
          id="content"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6"
        >
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
