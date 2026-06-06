"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { WalletButton } from "@/components/wallet-button";
import {
  Receipt,
  Shield,
  Sparkles,
  Database,
  ArrowRight,
  CheckCircle,
  Zap,
  Lock,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const account = useCurrentAccount();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <nav className="border-b border-gray-800/50 px-6 py-4 sticky top-0 bg-gray-950/90 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-700/40 rounded-lg">
              <Receipt size={18} className="text-violet-300" />
            </div>
            <span className="font-bold text-white text-lg">EternalReceipts</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">
              Dashboard
            </Link>
            <WalletButton />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-900/30 border border-violet-700/40 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-8">
          <Sparkles size={14} />
          Tatum x Walrus Hackathon · Built on Sui Mainnet
        </div>

        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
          Your receipts,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400">
            forever
          </span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Snap a photo of any receipt. AI extracts every detail instantly.
          Stored permanently on <strong className="text-white">Walrus</strong> and
          minted as a <strong className="text-white">Sui object</strong> you truly own.
          Never lose a warranty claim again.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/upload"
            className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3.5 rounded-2xl transition-colors text-lg"
          >
            Upload a Receipt <ArrowRight size={18} />
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 text-gray-200 font-medium px-8 py-3.5 rounded-2xl transition-colors text-lg"
          >
            View Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { value: "∞", label: "Storage duration" },
            { value: "< 30s", label: "Upload to mint" },
            { value: "100%", label: "You own your data" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-violet-400">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-800/50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            How it works
          </h2>
          <p className="text-gray-400 text-center mb-12">Three steps to permanent receipt storage</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: Zap,
                title: "Upload & AI Parse",
                desc: "Snap a photo or upload a PDF. Our AI instantly extracts store name, total, items, warranty info, and category.",
                color: "text-yellow-400",
                bg: "bg-yellow-900/20 border-yellow-700/30",
              },
              {
                step: "02",
                icon: Database,
                title: "Stored on Walrus",
                desc: "Your receipt image is uploaded to Walrus decentralized storage — permanently. No server, no middleman, no expiry.",
                color: "text-cyan-400",
                bg: "bg-cyan-900/20 border-cyan-700/30",
              },
              {
                step: "03",
                icon: Lock,
                title: "Minted on Sui",
                desc: "A dynamic Sui object is created in your wallet with the parsed metadata. You own it. Forever. On-chain proof.",
                color: "text-violet-400",
                bg: "bg-violet-900/20 border-violet-700/30",
              },
            ].map(({ step, icon: Icon, title, desc, color, bg }) => (
              <div key={step} className={`border rounded-2xl p-6 ${bg}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono text-gray-500">{step}</span>
                  <Icon size={20} className={color} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Everything you need
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: "Warranty Tracking", desc: "Never miss a warranty claim. Get countdowns for expiring warranties." },
              { icon: BarChart3, title: "Spending Analytics", desc: "Beautiful charts showing your spending by category and month." },
              { icon: Sparkles, title: "AI Receipt Parsing", desc: "Gemini AI extracts every detail — items, totals, dates, warranties." },
              { icon: Database, title: "Walrus Storage", desc: "Receipts stored permanently on decentralized Walrus network." },
              { icon: Lock, title: "Sui Ownership", desc: "Each receipt is a Sui object in your wallet. True digital ownership." },
              { icon: Receipt, title: "Tax Export", desc: "Export all receipts as CSV for tax filing in one click." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-gray-900/40 border border-gray-700/40 rounded-2xl p-5 hover:border-violet-700/40 transition-colors">
                <Icon size={18} className="text-violet-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-800/50 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to store your first receipt?
          </h2>
          <p className="text-gray-400 mb-8">
            Connect your Sui wallet and upload in under 30 seconds.
          </p>
          {!account ? (
            <div className="flex justify-center">
              <WalletButton />
            </div>
          ) : (
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3.5 rounded-2xl transition-colors text-lg"
            >
              Upload Your First Receipt <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-violet-400" />
            <span className="text-gray-400 text-sm">EternalReceipts — Tatum x Walrus Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Sui Mainnet</span>
            <span>·</span>
            <span>Walrus Storage</span>
            <span>·</span>
            <span>Tatum RPC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
