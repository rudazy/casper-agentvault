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
        description: "What AgentVault is and why it exists",
      },
      {
        href: "/docs/getting-started",
        label: "Getting Started",
        description: "Run the dashboard in under five minutes",
      },
      {
        href: "/docs/faucet",
        label: "Wallet & Faucet",
        description: "Create a testnet wallet and fund it with CSPR",
      },
    ],
  },
  {
    title: "Modules",
    items: [
      {
        href: "/docs/guardian",
        label: "Portfolio Guardian",
        description: "Yield monitoring and risk controls",
      },
      {
        href: "/docs/rwa",
        label: "RWA Oracle",
        description: "Compliance attestations for real-world assets",
      },
      {
        href: "/docs/marketplace",
        label: "Agent Marketplace",
        description: "Escrow-powered agent hiring",
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
        description: "Escrow and Attestation on casper-test",
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