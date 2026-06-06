"use client";

import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { WalletButton } from "@/components/wallet-button";
import { UploadZone } from "@/components/upload-zone";
import { Receipt, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { StoredReceipt } from "@/lib/types";

export default function UploadPage() {
  const account = useCurrentAccount();
  const [lastReceipt, setLastReceipt] = useState<StoredReceipt | null>(null);

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800/50 px-6 py-4 sticky top-0 bg-gray-950/90 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-700/40 rounded-lg">
              <Receipt size={18} className="text-violet-300" />
            </div>
            <span className="font-bold text-white">EternalReceipts</span>
          </Link>
          <div className="flex items-center gap-3">
            {account && (
              <Link
                href="/dashboard"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            )}
            <WalletButton />
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to home
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload a receipt</h1>
          <p className="text-gray-400">
            Photo, scan, or PDF — AI extracts everything and stores it permanently on-chain.
          </p>
        </div>

        {!account ? (
          <div className="text-center bg-gray-900/40 border border-gray-700/40 rounded-2xl p-10">
            <Receipt size={40} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-300 mb-2 font-medium">
              Connect your Sui wallet to get started
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Your receipts will be stored under your wallet address — you own them.
            </p>
            <div className="flex justify-center">
              <WalletButton />
            </div>
          </div>
        ) : (
          <div>
            <UploadZone onSuccess={setLastReceipt} />
            {lastReceipt && (
              <div className="mt-4 p-4 bg-green-950/30 border border-green-700/40 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-green-300 font-medium text-sm">
                    {lastReceipt.parsed.store_name} — $
                    {(lastReceipt.parsed.total_cents / 100).toFixed(2)}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Stored on Sui: {lastReceipt.object_id.slice(0, 16)}...
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                >
                  Dashboard <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
