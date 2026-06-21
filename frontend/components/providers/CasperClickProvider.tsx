"use client";

import type { AccountType, ICSPRClickSDK } from "@make-software/csprclick-core-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface CasperWalletContextValue {
  publicKey: string | undefined;
  provider: string | undefined;
  clickRef: ICSPRClickSDK | undefined;
  isReady: boolean;
  isConnecting: boolean;
  loadError: string | undefined;
  connectWallet: () => void;
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
  const [loadError, setLoadError] = useState<string | undefined>(undefined);

  const refreshActiveAccount = useCallback(async (ref: ICSPRClickSDK) => {
    const account = await readActiveAccount(ref);
    setConnectedAccount(account);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let bound = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let loadTimer: ReturnType<typeof setTimeout> | undefined;

    const bindSdk = (ref: ICSPRClickSDK) => {
      if (cancelled || bound) return;
      bound = true;
      setClickRef(ref);
      setLoadError(undefined);

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

      // Loaded may have fired before listeners were attached.
      window.setTimeout(markReady, 1000);

      ref.on("csprclick:signed_in", (event) => {
        if (cancelled) return;
        const account = extractAccount(event);
        setConnectedAccount(account);
        setIsConnecting(false);
        if (!account) {
          void refreshActiveAccount(ref);
        }
      });

      ref.on("csprclick:switched_account", (event) => {
        if (cancelled) return;
        const account = extractAccount(event);
        setConnectedAccount(account);
        setIsConnecting(false);
      });

      ref.on("csprclick:signed_out", () => {
        if (cancelled) return;
        setConnectedAccount(undefined);
        setIsConnecting(false);
      });

      ref.on("csprclick:disconnected", () => {
        if (cancelled) return;
        setConnectedAccount(undefined);
        setIsConnecting(false);
      });

      void readActiveAccount(ref).then((account) => {
        if (cancelled) return;
        if (account) {
          setConnectedAccount(account);
        }
      });

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

    loadTimer = setTimeout(() => {
      if (cancelled || window.csprclick) return;
      setLoadError("CSPR.click failed to load. Check your connection and refresh.");
    }, 15000);

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (loadTimer) clearTimeout(loadTimer);
    };
  }, [refreshActiveAccount]);

  const connectWallet = useCallback(() => {
    if (!clickRef) return;
    setIsConnecting(true);
    clickRef.signIn();
  }, [clickRef]);

  const disconnectWallet = useCallback(() => {
    clickRef?.signOut();
    setConnectedAccount(undefined);
    setIsConnecting(false);
  }, [clickRef]);

  const switchAccount = useCallback(() => {
    const walletProvider = connectedAccount?.provider ?? "casper-wallet";
    void clickRef?.switchAccount(walletProvider);
  }, [clickRef, connectedAccount?.provider]);

  const value = useMemo(
    () => ({
      publicKey: connectedAccount?.public_key,
      provider: connectedAccount?.provider,
      clickRef,
      isReady,
      isConnecting,
      loadError,
      connectWallet,
      disconnectWallet,
      switchAccount,
    }),
    [
      connectedAccount,
      clickRef,
      isReady,
      isConnecting,
      loadError,
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