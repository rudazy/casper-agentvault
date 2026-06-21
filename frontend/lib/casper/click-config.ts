import { CONTENT_MODE, type CsprClickInitOptions } from "@make-software/csprclick-core-types";
import type { ClickUIOptions } from "@make-software/csprclick-core-types/clickui";

export const CSPR_CLICK_SCRIPT_ID = "csprclick-client";
export const CSPR_CLICK_SCRIPT_SRC =
  "https://cdn.cspr.click/ui/v2.1.0/csprclick-client-2.1.0.js";

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
  appId: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID ?? "csprclick-template",
  contentMode: CONTENT_MODE.IFRAME,
  providers: ["casper-wallet", "ledger", "metamask-snap", "casperdash"],
  chainName: process.env.NEXT_PUBLIC_CASPER_CHAIN_NAME ?? "casper-test",
};