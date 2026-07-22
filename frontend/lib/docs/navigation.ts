export interface DocsNavItem {
  href: string;
  label: string;
  description?: string;
}

export interface DocsNavSection {
  title: string;
  items: DocsNavItem[];
}

export const docsNavigation: DocsNavSection[] = [
  {
    title: "Start here",
    items: [
      {
        href: "/docs",
        label: "Introduction",
        description: "The on-chain agent OS and its three applications",
      },
      {
        href: "/docs/getting-started",
        label: "Getting Started",
        description: "Connect your wallet and run your first actions",
      },
      {
        href: "/docs/faucet",
        label: "Wallet & Faucet",
        description: "Create a testnet wallet and fund it with CSPR",
      },
    ],
  },
  {
    title: "Applications",
    items: [
      {
        href: "/docs/guardian",
        label: "Portfolio Guardian",
        description: "Finance — yield monitoring and risk controls",
      },
      {
        href: "/docs/rwa",
        label: "RWA Oracle",
        description: "Compliance — attestations for real-world assets",
      },
      {
        href: "/docs/marketplace",
        label: "Agent Marketplace",
        description: "Commerce — escrow-powered agent hiring",
      },
      {
        href: "/docs/vault",
        label: "Session Vault",
        description: "Agent treasury — bounded session keys",
      },
    ],
  },
  {
    title: "Technical",
    items: [
      {
        href: "/docs/architecture",
        label: "Architecture",
        description: "How wallet, agents, and contracts connect",
      },
      {
        href: "/docs/contracts",
        label: "Smart Contracts",
        description: "Escrow, Attestation, and Vault on casper-test",
      },
    ],
  },
];

export function findDocsNavItem(pathname: string): DocsNavItem | undefined {
  for (const section of docsNavigation) {
    const match = section.items.find((item) => item.href === pathname);
    if (match) return match;
  }
  return undefined;
}