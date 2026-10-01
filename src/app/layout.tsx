import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "d4rkc0de",
  description:
    "d4rkc0de — cybersecurity club at Indraprastha Institute of Information Technology Delhi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex flex-1 flex-col bg-background">
          <div className="flex flex-1 flex-col bg-panel">
            <SiteHeader />
            <main className="flex flex-1 flex-col">
              <PageTransition>{children}</PageTransition>
            </main>
            <SiteFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
