"use client";

import { useEffect, useState, useMemo } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { WalletButton } from "@/components/wallet-button";
import { ReceiptCard } from "@/components/receipt-card";
import { SpendingCharts } from "@/components/dashboard-charts";
import { AIChat } from "@/components/ai-chat";
import { UploadZone } from "@/components/upload-zone";
import type { StoredReceipt, SpendingStats } from "@/lib/types";
import { format, parseISO } from "date-fns";
import {
  Receipt,
  Search,
  Download,
  TrendingUp,
  MessageSquare,
  Plus,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

type Tab = "receipts" | "analytics" | "ai" | "upload";

export default function DashboardPage() {
  const account = useCurrentAccount();
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("receipts");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  useEffect(() => {
    if (!account?.address) return;
    setLoading(true);
    fetch(`/api/receipts?address=${account.address}`)
      .then((r) => r.json())
      .then((d) => setReceipts(d.receipts ?? []))
      .finally(() => setLoading(false));
  }, [account?.address]);

  const categories = useMemo(() => {
    const cats = new Set(receipts.map((r) => r.parsed.category));
    return ["All", ...Array.from(cats).sort()];
  }, [receipts]);

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      const matchSearch =
        !search ||
        r.parsed.store_name.toLowerCase().includes(search.toLowerCase()) ||
        r.parsed.category.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        categoryFilter === "All" || r.parsed.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [receipts, search, categoryFilter]);

  const stats: SpendingStats = useMemo(() => {
    const by_category: Record<string, number> = {};
    const by_month_map: Record<string, number> = {};

    receipts.forEach((r) => {
      by_category[r.parsed.category] =
        (by_category[r.parsed.category] ?? 0) + r.parsed.total_cents;

      const month = r.parsed.purchase_date
        ? format(parseISO(r.parsed.purchase_date), "MMM yy")
        : "Unknown";
      by_month_map[month] = (by_month_map[month] ?? 0) + r.parsed.total_cents;
    });

    return {
      total_cents: receipts.reduce((s, r) => s + r.parsed.total_cents, 0),
      by_category,
      by_month: Object.entries(by_month_map)
        .map(([month, total_cents]) => ({ month, total_cents }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      receipt_count: receipts.length,
    };
  }, [receipts]);

  const expiringWarranties = receipts.filter((r) => {
    if (!r.parsed.warranty_expiry) return false;
    const days = Math.ceil(
      (new Date(r.parsed.warranty_expiry).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    );
    return days >= 0 && days <= 30;
  });

  const exportCSV = () => {
    const rows = [
      ["Date", "Store", "Category", "Total (USD)", "Object ID"],
      ...receipts.map((r) => [
        r.parsed.purchase_date,
        r.parsed.store_name,
        r.parsed.category,
        (r.parsed.total_cents / 100).toFixed(2),
        r.object_id,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "eternal-receipts-export.csv";
    a.click();
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <Receipt size={40} className="text-gray-600" />
        <p className="text-gray-300">Connect your wallet to view your receipts</p>
        <WalletButton />
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: typeof Receipt }[] = [
    { id: "receipts", label: "Receipts", icon: Receipt },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "ai", label: "AI Chat", icon: MessageSquare },
    { id: "upload", label: "Upload", icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800/50 px-6 py-4 sticky top-0 bg-gray-950/90 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Receipt size={18} className="text-violet-400" />
            <span className="font-bold text-white">EternalReceipts</span>
          </Link>
          <WalletButton />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Receipts", value: stats.receipt_count, suffix: "" },
            { label: "Total Spent", value: `$${(stats.total_cents / 100).toFixed(0)}`, suffix: "" },
            { label: "Categories", value: Object.keys(stats.by_category).length, suffix: "" },
            {
              label: "Warranties",
              value: expiringWarranties.length,
              suffix: " expiring",
              alert: expiringWarranties.length > 0,
            },
          ].map(({ label, value, suffix, alert }) => (
            <div
              key={label}
              className={`bg-gray-900/60 border rounded-2xl p-4 ${
                alert ? "border-yellow-700/50 bg-yellow-950/20" : "border-gray-700/50"
              }`}
            >
              <p className="text-gray-400 text-xs mb-1">{label}</p>
              <p className="text-2xl font-bold text-white">
                {value}
                <span className="text-sm font-normal text-gray-400">{suffix}</span>
              </p>
              {alert && <ShieldAlert size={12} className="text-yellow-400 mt-1" />}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900/40 rounded-xl p-1 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-violet-700/60 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "receipts" && (
          <div>
            <div className="flex gap-3 mb-5 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search receipts..."
                  className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500/60"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-900/60 border border-gray-700/50 rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-violet-500/60"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 border border-gray-700/50 rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <Loader2 size={32} className="text-violet-400 animate-spin mx-auto" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Receipt size={40} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">No receipts yet. Upload your first one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map((r) => (
                  <ReceiptCard key={r.object_id} receipt={r} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "analytics" && <SpendingCharts stats={stats} />}

        {tab === "ai" && <AIChat />}

        {tab === "upload" && (
          <div className="max-w-xl">
            <UploadZone
              onSuccess={(r) => {
                setReceipts((prev) => [r, ...prev]);
                setTab("receipts");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
