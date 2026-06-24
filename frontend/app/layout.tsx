import { AppProviders } from "@/components/providers/AppProviders";
import {
  clickSDKOptions,
  clickUIOptions,
  CSPR_CLICK_SCRIPT_ID,
  CSPR_CLICK_SCRIPT_SRC,
} from "@/lib/casper/click-config";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inlineClickConfig = `window.clickUIOptions=${JSON.stringify(clickUIOptions)};window.clickSDKOptions=${JSON.stringify(clickSDKOptions)};`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_TAGLINE,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_TAGLINE,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_TAGLINE,
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
      <body
        id="agentvault-root"
        className="min-h-full bg-[#0a0a0a] font-mono text-[#f5f5f5] antialiased"
      >
        <Script id="csprclick-config" strategy="beforeInteractive">
          {inlineClickConfig}
        </Script>
        <Script
          id={CSPR_CLICK_SCRIPT_ID}
          src={CSPR_CLICK_SCRIPT_SRC}
          strategy="afterInteractive"
        />
        <div id="csprclick-ui" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}