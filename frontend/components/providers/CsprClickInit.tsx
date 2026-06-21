"use client";

import Script from "next/script";
import {
  clickSDKOptions,
  clickUIOptions,
  CSPR_CLICK_SCRIPT_ID,
  CSPR_CLICK_SCRIPT_SRC,
} from "@/lib/casper/click-config";

const inlineConfig = `window.clickUIOptions=${JSON.stringify(clickUIOptions)};window.clickSDKOptions=${JSON.stringify(clickSDKOptions)};`;

export function CsprClickInit() {
  return (
    <>
      <Script id="csprclick-config" strategy="beforeInteractive">
        {inlineConfig}
      </Script>
      <Script
        id={CSPR_CLICK_SCRIPT_ID}
        src={CSPR_CLICK_SCRIPT_SRC}
        strategy="afterInteractive"
      />
    </>
  );
}