import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MainNav } from "@/components/navigation/MainNav";
import { Footer } from "@/components/navigation/Footer";
import { TRPCProvider } from "@/components/providers/TRPCProvider";
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
  title: {
    default: "Lawn Genius - Professional Lawn Care Services",
    template: "%s | Lawn Genius",
  },
  description:
    "Expert lawn care services including mowing, landscaping, fertilization, and maintenance. Transform your outdoor space with Lawn Genius.",
  keywords: [
    "lawn care",
    "landscaping",
    "lawn maintenance",
    "grass cutting",
    "yard work",
    "professional landscaping",
    "lawn service",
  ],
  authors: [{ name: "Lawn Genius" }],
  creator: "Lawn Genius",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lawngenius.com",
    siteName: "Lawn Genius",
    title: "Lawn Genius - Professional Lawn Care Services",
    description:
      "Expert lawn care services including mowing, landscaping, fertilization, and maintenance. Transform your outdoor space with Lawn Genius.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lawn Genius - Professional Lawn Care Services",
    description:
      "Expert lawn care services including mowing, landscaping, fertilization, and maintenance. Transform your outdoor space with Lawn Genius.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full flex flex-col`}
      >
        <TRPCProvider>
          <MainNav />
          <main className="flex-grow">{children}</main>
          <Footer />
        </TRPCProvider>
      </body>
    </html>
  );
}
