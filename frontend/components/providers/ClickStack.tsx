"use client";

import { CasperClickProvider } from "@/components/providers/CasperClickProvider";
import { clickSDKOptions } from "@/lib/casper/click-config";
import {
  ClickProvider,
  ClickUI,
  CsprClickThemes,
  ThemeModeType,
} from "@make-software/csprclick-ui";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";

export function ClickStack({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={CsprClickThemes.dark}>
      <ClickProvider options={clickSDKOptions}>
        <ClickUI
          themeMode={ThemeModeType.dark}
          rootAppElement="#agentvault-root"
          show1ClickModal={false}
        />
        <CasperClickProvider>{children}</CasperClickProvider>
      </ClickProvider>
    </ThemeProvider>
  );
}