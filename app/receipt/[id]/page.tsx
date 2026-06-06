import { getReceiptObject } from "@/lib/tatum";
import { walrusBlobUrl } from "@/lib/walrus";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  Shield,
  ExternalLink,
  Calendar,
  Tag,
  DollarSign,
  Database,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let obj;
  try {
    obj = await getReceiptObject(id);
  } catch {
    notFound();
  }

  if (!obj.data || obj.data.content?.dataType !== "moveObject") notFound();

  const fields = obj.data.content.fields as Record<string, unknown>;
  const blobId = fields.blob_id as string;
  const blobUrl = walrusBlobUrl(blobId);
  const totalCents = Number(fields.total_cents);
  const warrantyExpiry = fields.warranty_expiry as string;
  const purchaseDate = fields.purchase_date as string;

  let warrantyDays = 0;
  let warrantyStatus = "none";
  if (warrantyExpiry) {
    warrantyDays = differenceInDays(parseISO(warrantyExpiry), new Date());
    warrantyStatus =
      warrantyDays < 0 ? "expired" : warrantyDays <= 30 ? "expiring" : "active";
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Dashboard
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-300 text-sm font-mono">
            {id.slice(0, 16)}...
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Receipt image */}
          <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blobUrl}
              alt="Receipt"
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {fields.store_name as string}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {purchaseDate
                  ? format(parseISO(purchaseDate), "MMMM d, yyyy")
                  : "Unknown date"}
              </p>
            </div>

            {/* Warranty */}
            {warrantyExpiry && (
              <div
                className={`rounded-xl p-4 border ${
                  warrantyStatus === "active"
                    ? "bg-green-950/30 border-green-700/40"
                    : warrantyStatus === "expiring"
                    ? "bg-yellow-950/30 border-yellow-700/40"
                    : "bg-red-950/30 border-red-700/40"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield
                    size={14}
                    className={
                      warrantyStatus === "active"
                        ? "text-green-400"
                        : warrantyStatus === "expiring"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }
                  />
                  <span className="text-sm font-medium text-gray-200">Warranty</span>
                </div>
                <p className="text-sm text-gray-300">
                  Expires: {format(parseISO(warrantyExpiry), "MMMM d, yyyy")}
                  {warrantyStatus !== "expired" && (
                    <span className="ml-2 text-xs text-gray-400">
                      ({warrantyDays} days left)
                    </span>
                  )}
                  {warrantyStatus === "expired" && (
                    <span className="ml-2 text-xs text-red-400">EXPIRED</span>
                  )}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-3">
              {[
                {
                  icon: DollarSign,
                  label: "Total",
                  value: `$${(totalCents / 100).toFixed(2)} ${fields.currency}`,
                },
                { icon: Tag, label: "Category", value: fields.category as string },
                { icon: Calendar, label: "Date", value: purchaseDate },
                {
                  icon: Database,
                  label: "Walrus Blob",
                  value: `${blobId.slice(0, 20)}...`,
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 bg-gray-900/40 border border-gray-700/40 rounded-xl p-3"
                >
                  <Icon size={14} className="text-violet-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm text-gray-200">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Verification links */}
            <div className="flex gap-3 pt-2">
              <a
                href={`https://suiexplorer.com/object/${id}?network=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 border border-gray-700/40 rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
              >
                <ExternalLink size={13} />
                View on Sui Explorer
              </a>
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 border border-gray-700/40 rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
              >
                <Database size={13} />
                View on Walrus
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
