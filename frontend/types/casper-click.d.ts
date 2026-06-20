import type { CsprClickInitOptions, ICSPRClickSDK } from "@make-software/csprclick-core-types";
import type { ClickUIOptions } from "@make-software/csprclick-core-types/clickui";

export {};

declare global {
  interface Window {
    csprclick?: ICSPRClickSDK;
    clickUIOptions: ClickUIOptions;
    clickSDKOptions: CsprClickInitOptions;
  }
}