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
import {
  clickSDKOptions,
  clickUIOptions,
  CSPR_CLICK_SCRIPT_ID,
  CSPR_CLICK_SCRIPT_SRC,
} from "@/lib/casper/click-config";

type WalletLoginMethod = "casper" | "email" | null;

interface CasperWalletContextValue {
  publicKey: string | undefined;
  provider: string | undefined;
  clickRef: ICSPRClickSDK | undefined;
  isReady: boolean;
  isConnecting: boolean;
  loginMethod: WalletLoginMethod;
  connectCasperWallet: () => void;
  connectEmailWallet: () => void;
  disconnectWallet: () => void;
  switchAccount: () => void;
}

const CasperWalletContext = createContext<CasperWalletContextValue | undefined>(undefined);

function assignClickGlobals() {
  if (typeof window === "undefined") return;
  window.clickUIOptions = clickUIOptions;
  window.clickSDKOptions = clickSDKOptions;
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
  const [loginMethod, setLoginMethod] = useState<WalletLoginMethod>(null);
  const [pendingMethod, setPendingMethod] = useState<WalletLoginMethod>(null);

  const refreshActiveAccount = useCallback(async (ref: ICSPRClickSDK) => {
    const account = await readActiveAccount(ref);
    setConnectedAccount(account);
    if (!account) {
      setLoginMethod(null);
    }
  }, []);

  useEffect(() => {
    assignClickGlobals();

    const onLoaded = () => {
      if (!window.csprclick) return;
      const ref = window.csprclick;
      setClickRef(ref);
      setIsReady(true);
      void refreshActiveAccount(ref);
    };

    const onSignedIn = () => {
      if (!window.csprclick) return;
      if (pendingMethod) {
        setLoginMethod(pendingMethod);
        setPendingMethod(null);
      }
      setIsConnecting(false);
      void refreshActiveAccount(window.csprclick);
    };

    const onSignedOut = () => {
      setConnectedAccount(undefined);
      setLoginMethod(null);
      setPendingMethod(null);
      setIsConnecting(false);
    };

    const onAccountChanged = (event: Event) => {
      const customEvent = event as CustomEvent<AccountType>;
      const account = customEvent.detail;
      if (account?.public_key) {
        setConnectedAccount(account);
      } else {
        setConnectedAccount(undefined);
        setLoginMethod(null);
      }
      setIsConnecting(false);
    };

    window.addEventListener("csprclick:loaded", onLoaded);
    window.addEventListener("csprclick:signed_in", onSignedIn);
    window.addEventListener("csprclick:signed_out", onSignedOut);
    window.addEventListener("csprclick:account_changed", onAccountChanged);

    if (!document.getElementById(CSPR_CLICK_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = CSPR_CLICK_SCRIPT_ID;
      script.src = CSPR_CLICK_SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    } else if (window.csprclick) {
      onLoaded();
    }

    return () => {
      window.removeEventListener("csprclick:loaded", onLoaded);
      window.removeEventListener("csprclick:signed_in", onSignedIn);
      window.removeEventListener("csprclick:signed_out", onSignedOut);
      window.removeEventListener("csprclick:account_changed", onAccountChanged);
    };
  }, [pendingMethod, refreshActiveAccount]);

  const connectCasperWallet = useCallback(() => {
    if (!clickRef) return;
    setPendingMethod("casper");
    setIsConnecting(true);
    clickRef.signIn();
  }, [clickRef]);

  const connectEmailWallet = useCallback(() => {
    if (!clickRef) return;
    setPendingMethod("email");
    setIsConnecting(true);
    clickRef.signIn();
  }, [clickRef]);

  const disconnectWallet = useCallback(() => {
    clickRef?.signOut();
    setConnectedAccount(undefined);
    setLoginMethod(null);
    setPendingMethod(null);
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
      loginMethod,
      connectCasperWallet,
      connectEmailWallet,
      disconnectWallet,
      switchAccount,
    }),
    [
      connectedAccount,
      clickRef,
      isReady,
      isConnecting,
      loginMethod,
      connectCasperWallet,
      connectEmailWallet,
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