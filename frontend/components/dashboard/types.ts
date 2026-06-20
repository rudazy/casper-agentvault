import type { ContractActionId } from "@/lib/casper/contract-actions";
import type { TxFeedback, TxStatus } from "@/hooks/useContractActions";

export type TabId = "guardian" | "rwa" | "marketplace";

export interface TabAction {
  id: ContractActionId;
  label: string;
  hint: string;
  primary?: boolean;
}

export interface ActivityEntry {
  id: string;
  actionId: ContractActionId;
  label: string;
  status: TxStatus;
  message: string;
  timestamp: number;
  transactionHash?: string;
}

export interface TabPanelProps {
  accent: string;
  connected: boolean;
  publicKey?: string;
  runAction: (
    actionId: ContractActionId,
    payload?: Record<string, unknown>,
  ) => Promise<void>;
  feedback: TxFeedback;
  busyAction: ContractActionId | null;
  clearFeedback: () => void;
  lastBalance: string | null;
  recentActivity: ActivityEntry[];
}