"use client";

import { StoredReceipt } from "@/lib/types";
import { format, parseISO, differenceInDays } from "date-fns";
import { ExternalLink, Shield, ShieldAlert, ShieldOff } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: "bg-blue-900/40 text-blue-300",
  Groceries: "bg-green-900/40 text-green-300",
  Restaurant: "bg-orange-900/40 text-orange-300",
  Clothing: "bg-pink-900/40 text-pink-300",
  Healthcare: "bg-red-900/40 text-red-300",
  Travel: "bg-cyan-900/40 text-cyan-300",
  Home: "bg-yellow-900/40 text-yellow-300",
  Entertainment: "bg-purple-900/40 text-purple-300",
  Automotive: "bg-gray-700/40 text-gray-300",
  Other: "bg-gray-800/40 text-gray-400",
};

export function ReceiptCard({ receipt }: { receipt: StoredReceipt }) {
  const { parsed, object_id } = receipt;
  const total = `$${(parsed.total_cents / 100).toFixed(2)}`;
  const date = parsed.purchase_date
    ? format(parseISO(parsed.purchase_date), "MMM d, yyyy")
    : "Unknown date";

  let warrantyStatus: "active" | "expiring" | "expired" | "none" = "none";
  let warrantyDays = 0;

  if (parsed.warranty_expiry) {
    warrantyDays = differenceInDays(parseISO(parsed.warranty_expiry), new Date());
    warrantyStatus =
      warrantyDays < 0 ? "expired" : warrantyDays <= 30 ? "expiring" : "active";
  }

  const WarrantyIcon =
    warrantyStatus === "active"
      ? Shield
      : warrantyStatus === "expiring"
      ? ShieldAlert
      : warrantyStatus === "expired"
      ? ShieldOff
      : null;

  return (
    <Link
      href={`/receipt/${object_id}`}
      className="block group bg-gray-900/60 border border-gray-700/50 rounded-2xl p-5 hover:border-violet-500/50 hover:bg-gray-900/80 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                CATEGORY_COLORS[parsed.category] ?? CATEGORY_COLORS.Other,
              )}
            >
              {parsed.category}
            </span>
            {WarrantyIcon && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                  warrantyStatus === "active" && "bg-green-900/40 text-green-300",
                  warrantyStatus === "expiring" && "bg-yellow-900/40 text-yellow-300",
                  warrantyStatus === "expired" && "bg-red-900/40 text-red-300",
                )}
              >
                <WarrantyIcon size={11} />
                {warrantyStatus === "active" && `${warrantyDays}d`}
                {warrantyStatus === "expiring" && `${warrantyDays}d left!`}
                {warrantyStatus === "expired" && "expired"}
              </span>
            )}
          </div>

          <h3 className="font-semibold text-white truncate group-hover:text-violet-200 transition-colors">
            {parsed.store_name}
          </h3>
          <p className="text-gray-400 text-sm mt-0.5">{date}</p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-white">{total}</p>
          <div className="flex items-center justify-end gap-1 mt-1 text-gray-500 group-hover:text-violet-400 transition-colors">
            <ExternalLink size={11} />
            <span className="text-xs">View</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
