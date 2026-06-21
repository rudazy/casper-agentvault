"use client";

import type { AccountType } from "@make-software/csprclick-core-types";
import { useClickRef } from "@make-software/csprclick-ui";
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

interface CasperWalletContextValue {
  publicKey: string | undefined;
  provider: string | undefined;
  clickRef: ReturnType<typeof useClickRef>;
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

async function readActiveAccount(
  ref: NonNullable<ReturnType<typeof useClickRef>>,
): Promise<AccountType | undefined> {
  try {
    const account = await ref.getActiveAccountAsync({ withBalance: true });
    return account?.public_key ? account : undefined;
  } catch {
    return undefined;
  }
}

export function CasperClickProvider({ children }: { children: ReactNode }) {
  const clickRef = useClickRef();
  const [connectedAccount, setConnectedAccount] = useState<AccountType | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | undefined>(undefined);

  const refreshActiveAccount = useCallback(async () => {
    if (!clickRef) return;
    const account = await readActiveAccount(clickRef);
    setConnectedAccount(account);
  }, [clickRef]);

  useEffect(() => {
    if (!clickRef) return;

    let ready = false;
    const markReady = () => {
      if (ready) return;
      ready = true;
      setIsReady(true);
      void refreshActiveAccount();
    };

    if (typeof clickRef.once === "function") {
      clickRef.once("csprclick:loaded", markReady);
    } else {
      clickRef.on("csprclick:loaded", markReady);
    }

    const readyTimer = window.setTimeout(markReady, 1000);

    const onSignedIn = (event: unknown) => {
      const account = extractAccount(event);
      setConnectedAccount(account);
      setIsConnecting(false);
      setConnectError(undefined);
      if (!account) {
        void refreshActiveAccount();
      }
    };

    const onSignedOut = () => {
      setConnectedAccount(undefined);
      setIsConnecting(false);
    };

    clickRef.on("csprclick:signed_in", onSignedIn);
    clickRef.on("csprclick:switched_account", onSignedIn);
    clickRef.on("csprclick:signed_out", onSignedOut);
    clickRef.on("csprclick:disconnected", onSignedOut);

    void refreshActiveAccount();

    return () => {
      window.clearTimeout(readyTimer);
    };
  }, [clickRef, refreshActiveAccount]);

  const connectWallet = useCallback(async () => {
    if (!clickRef) {
      setConnectError("CSPR.click is still loading. Wait a moment and try again.");
      return;
    }

    setIsConnecting(true);
    setConnectError(undefined);

    try {
      const hasExtension = clickRef.isProviderPresent(CASPER_WALLET_PROVIDER);

      if (hasExtension) {
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
      isReady: Boolean(clickRef) && isReady,
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