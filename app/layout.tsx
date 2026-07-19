import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

// Clean sans for data + UI, warm serif for display headings.
const sans = Inter({
  variable: "--font-sans-src",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display-src",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "saxontrack — Health",
  description: "A calm, local-first health tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-AU"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
