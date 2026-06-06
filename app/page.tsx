"use client";

import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { WalletButton } from "@/components/wallet-button";
import { UploadZone } from "@/components/upload-zone";
import { Receipt, Shield, Sparkles, Database, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { StoredReceipt } from "@/lib/types";

export default function HomePage() {
  const account = useCurrentAccount();
  const [lastReceipt, setLastReceipt] = useState<StoredReceipt | null>(null);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800/50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-700/40 rounded-lg">
              <Receipt size={18} className="text-violet-300" />
            </div>
            <span className="font-bold text-white">EternalReceipts</span>
          </div>
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

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-900/30 border border-violet-700/40 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-6">
            <Sparkles size={14} />
            Built on Walrus + Sui · Tatum x Walrus Hackathon
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your receipts,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
              forever
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Snap a photo of any receipt. AI extracts every detail. It&apos;s stored
            permanently on Walrus and minted as a Sui object you truly own.
            Never lose a warranty claim again.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {[
            { icon: Database, label: "Walrus permanent storage" },
            { icon: Shield, label: "Sui blockchain ownership" },
            { icon: Sparkles, label: "AI-powered parsing" },
            { icon: Receipt, label: "Warranty tracking" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 bg-gray-900/60 border border-gray-700/40 rounded-full px-4 py-2 text-sm text-gray-300"
            >
              <Icon size={14} className="text-violet-400" />
              {label}
            </div>
          ))}
        </div>

        {/* Upload */}
        <div className="max-w-xl mx-auto">
          {!account ? (
            <div className="text-center bg-gray-900/40 border border-gray-700/40 rounded-2xl p-10">
              <Receipt size={40} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-300 mb-2 font-medium">
                Connect your Sui wallet to get started
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Your receipts are stored under your wallet address — you own them.
              </p>
              <WalletButton />
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
        </div>
      </main>
    </div>
  );
}
