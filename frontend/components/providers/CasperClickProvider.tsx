"use client";

import type { AccountType, ICSPRClickSDK } from "@make-software/csprclick-core-types";
import {
  CSPR_CLICK_PRODUCTION_SETUP_MESSAGE,
  CSPR_CLICK_TEMPLATE_APP_ID,
} from "@/lib/casper/click-config";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const CASPER_WALLET_PROVIDER = "casper-wallet";
const SDK_LOAD_TIMEOUT_MS = 12_000;

function isLocalhostHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function getConfiguredAppId(): string {
  if (typeof window !== "undefined" && window.clickSDKOptions?.appId) {
    return window.clickSDKOptions.appId;
  }
  return CSPR_CLICK_TEMPLATE_APP_ID;
}

function getProductionAppIdError(): string | undefined {
  if (typeof window === "undefined") return undefined;
  if (isLocalhostHost(window.location.hostname)) return undefined;
  if (getConfiguredAppId() !== CSPR_CLICK_TEMPLATE_APP_ID) return undefined;
  return CSPR_CLICK_PRODUCTION_SETUP_MESSAGE;
}

interface CasperWalletContextValue {
  publicKey: string | undefined;
  provider: string | undefined;
  clickRef: ICSPRClickSDK | undefined;
  isReady: boolean;
  isConnecting: boolean;
  connectError: string | undefined;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchAccount: () => void;
}

const CasperWalletContext = createContext<CasperWalletContextValue | undefined>(undefined);

function extractAccount(event: unknown): AccountType | undefined {
  if (!event || typeof event !== "object") return undefined;
  const record = event as Record<string, unknown>;
  const candidate = (record.account ?? record) as AccountType;
  return candidate?.public_key ? candidate : undefined;
}

async function readActiveAccount(ref: ICSPRClickSDK): Promise<AccountType | undefined> {
  try {
    const account = await ref.getActiveAccountAsync({ withBalance: true });
    return account?.public_key ? account : undefined;
  } catch {
    return undefined;
  }
}

export function CasperClickProvider({ children }: { children: ReactNode }) {
  const [connectedAccount, setConnectedAccount] = useState<AccountType | undefined>(undefined);
  const [clickRef, setClickRef] = useState<ICSPRClickSDK | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | undefined>(undefined);

  const refreshActiveAccount = useCallback(async (ref: ICSPRClickSDK) => {
    const account = await readActiveAccount(ref);
    setConnectedAccount(account);
  }, []);

  useEffect(() => {
    const productionAppIdError = getProductionAppIdError();
    if (productionAppIdError) {
      setConnectError(productionAppIdError);
    }

    let cancelled = false;
    let bound = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    const loadTimeout = window.setTimeout(() => {
      if (cancelled || bound) return;
      setConnectError((current) => current ?? getProductionAppIdError() ?? "CSPR.click failed to load. Check your network and try again.");
    }, SDK_LOAD_TIMEOUT_MS);

    const bindSdk = (ref: ICSPRClickSDK) => {
      if (cancelled || bound) return;
      bound = true;
      setClickRef(ref);

      let ready = false;
      const markReady = () => {
        if (cancelled || ready) return;
        ready = true;
        setIsReady(true);
        void refreshActiveAccount(ref);
      };

      if (typeof ref.once === "function") {
        ref.once("csprclick:loaded", markReady);
      } else {
        ref.on("csprclick:loaded", markReady);
      }

      window.setTimeout(markReady, 1000);

      const onSignedIn = (event: unknown) => {
        const account = extractAccount(event);
        setConnectedAccount(account);
        setIsConnecting(false);
        setConnectError(undefined);
        if (!account) {
          void refreshActiveAccount(ref);
        }
      };

      const onSignedOut = () => {
        setConnectedAccount(undefined);
        setIsConnecting(false);
      };

      ref.on("csprclick:signed_in", onSignedIn);
      ref.on("csprclick:switched_account", onSignedIn);
      ref.on("csprclick:signed_out", onSignedOut);
      ref.on("csprclick:disconnected", onSignedOut);

      void refreshActiveAccount(ref);
    };

    if (window.csprclick) {
      bindSdk(window.csprclick);
    } else {
      pollTimer = setInterval(() => {
        if (window.csprclick) {
          bindSdk(window.csprclick);
          if (pollTimer) clearInterval(pollTimer);
        }
      }, 200);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimeout);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [refreshActiveAccount]);

  const connectWallet = useCallback(async () => {
    if (!clickRef) {
      setConnectError("CSPR.click is still loading. Wait a moment and try again.");
      return;
    }

    setIsConnecting(true);
    setConnectError(undefined);

    try {
      if (clickRef.isProviderPresent(CASPER_WALLET_PROVIDER)) {
        const account = await clickRef.connect(CASPER_WALLET_PROVIDER, {});
        if (account?.public_key) {
          setConnectedAccount(account);
          setIsConnecting(false);
          return;
        }
      }

      clickRef.signIn();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Wallet connection failed. Try again.";
      setConnectError(message);
      setIsConnecting(false);
    }
  }, [clickRef]);

  const disconnectWallet = useCallback(() => {
    clickRef?.signOut();
    setConnectedAccount(undefined);
    setIsConnecting(false);
    setConnectError(undefined);
  }, [clickRef]);

  const switchAccount = useCallback(() => {
    const walletProvider = connectedAccount?.provider ?? CASPER_WALLET_PROVIDER;
    void clickRef?.switchAccount(walletProvider);
  }, [clickRef, connectedAccount?.provider]);

  const value = useMemo(
    () => ({
      publicKey: connectedAccount?.public_key,
      provider: connectedAccount?.provider,
      clickRef,
      isReady,
      isConnecting,
      connectError,
      connectWallet,
      disconnectWallet,
      switchAccount,
    }),
    [
      connectedAccount,
      clickRef,
      isReady,
      isConnecting,
      connectError,
      connectWallet,
      disconnectWallet,
      switchAccount,
    ],
  );

  return <CasperWalletContext.Provider value={value}>{children}</CasperWalletContext.Provider>;
}

export function useCasperWallet(): CasperWalletContextValue {
  const context = useContext(CasperWalletContext);
  if (!context) {
    throw new Error("useCasperWallet must be used within CasperClickProvider");
  }
  return context;
}