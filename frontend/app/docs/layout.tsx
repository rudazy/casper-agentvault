import { DocsShell } from "@/components/docs/DocsShell";
import { SiteBackground } from "@/components/SiteBackground";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Documentation | ${SITE_NAME}`,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: `Documentation | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    url: `${SITE_URL}/docs`,
    siteName: SITE_NAME,
    type: "website",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteBackground />
      <DocsShell>{children}</DocsShell>
    </>
  );
}