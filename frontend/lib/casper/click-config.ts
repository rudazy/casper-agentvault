import { CONTENT_MODE, type CsprClickInitOptions } from "@make-software/csprclick-core-types";
import type { ClickUIOptions } from "@make-software/csprclick-core-types/clickui";
import { SITE_DOMAIN } from "@/lib/site";

export const CSPR_CLICK_SCRIPT_ID = "csprclick-client";
export const CSPR_CLICK_SCRIPT_SRC =
  "https://cdn.cspr.click/ui/v2.1.0/csprclick-client-2.1.0.js";

/** Localhost-only dev id — register a production id at https://console.cspr.build */
export const CSPR_CLICK_TEMPLATE_APP_ID = "csprclick-template";

export const CSPR_CLICK_PRODUCTION_SETUP_MESSAGE =
  `Wallet connect requires a production CSPR.click app id. Register ${SITE_DOMAIN} (and any Vercel preview domains) at console.cspr.build, set NEXT_PUBLIC_CSPR_CLICK_APP_ID in Vercel, then redeploy.`;

export const clickUIOptions: ClickUIOptions = {
  uiContainer: "csprclick-ui",
  rootAppElement: "#agentvault-root",
  show1ClickModal: true,
  showTopBar: false,
  defaultTheme: "dark",
  accountMenuItems: [],
};

export const clickSDKOptions: CsprClickInitOptions = {
  appName: "Casper AgentVault",
  appId: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID ?? CSPR_CLICK_TEMPLATE_APP_ID,
  contentMode: CONTENT_MODE.IFRAME,
  providers: ["casper-wallet", "ledger", "metamask-snap", "casperdash"],
  chainName: process.env.NEXT_PUBLIC_CASPER_CHAIN_NAME ?? "casper-test",
};