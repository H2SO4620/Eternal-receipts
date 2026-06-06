"use client";

import {
  ConnectButton,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { Wallet, LogOut } from "lucide-react";

export function WalletButton() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();

  if (!account) {
    return (
      <ConnectButton
        connectText="Connect Wallet"
        className="!bg-violet-600 !text-white !rounded-xl !px-4 !py-2 !font-medium hover:!bg-violet-700 !transition-colors"
      />
    );
  }

  const short = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 bg-violet-950/60 border border-violet-700/40 rounded-xl px-3 py-2">
        <Wallet size={14} className="text-violet-400" />
        <span className="text-sm text-violet-200 font-mono">{short}</span>
      </div>
      <button
        onClick={() => disconnect()}
        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
        title="Disconnect"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}
