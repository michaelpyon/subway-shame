import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Subway Shame | NYC's Worst Train Lines, Ranked Daily",
  description:
    "Real-time NYC subway delay leaderboard. Every line ranked by shame score. Updated every 5 minutes from MTA data.",
  metadataBase: new URL("https://subwayshame.com"),
  openGraph: {
    title: "Subway Shame",
    description:
      "Real-time NYC subway delay leaderboard. Which line is the worst today?",
    url: "https://subwayshame.com",
    siteName: "Subway Shame",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Subway Shame - today's worst NYC subway lines",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Subway Shame",
    description:
      "Real-time NYC subway delay leaderboard. Which line is the worst today?",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body
        className="min-h-full antialiased"
        style={{
          backgroundColor: "#0A0A0A",
          color: "#F5F0E8",
        }}
      >
        {children}
      </body>
    </html>
  );
}
