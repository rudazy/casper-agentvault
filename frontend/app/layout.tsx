import { AppProviders } from "@/components/providers/AppProviders";
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
  title: "Casper AgentVault",
  description: "Agentic Smart Wallet for DeFi and RWA on Casper Network",
  openGraph: {
    title: "Casper AgentVault",
    description: "Agentic Smart Wallet for DeFi and RWA on Casper Network",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Casper AgentVault" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Casper AgentVault",
    description: "Agentic Smart Wallet for DeFi and RWA on Casper Network",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-[#0a0a0a] font-mono text-[#f5f5f5] antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}