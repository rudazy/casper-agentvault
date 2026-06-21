import { CONTENT_MODE, type CsprClickInitOptions } from "@make-software/csprclick-core-types";

export const clickSDKOptions: CsprClickInitOptions = {
  appName: "Casper AgentVault",
  appId: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_ID ?? "csprclick-template",
  contentMode: CONTENT_MODE.IFRAME,
  providers: ["casper-wallet", "ledger", "metamask-snap", "casperdash"],
  chainName: process.env.NEXT_PUBLIC_CASPER_CHAIN_NAME ?? "casper-test",
};