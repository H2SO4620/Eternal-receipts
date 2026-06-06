"use client";

import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { buildMintTransaction } from "@/lib/tatum";
import { storeReceiptMemory } from "@/lib/walrus-memory";
import type { ParsedReceipt, StoredReceipt } from "@/lib/types";
import {
  Upload,
  Camera,
  FileText,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stage =
  | "idle"
  | "uploading"
  | "parsing"
  | "minting"
  | "storing"
  | "done"
  | "error";

interface UploadZoneProps {
  onSuccess: (receipt: StoredReceipt) => void;
}

export function UploadZone({ onSuccess }: UploadZoneProps) {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!account) {
        setError("Please connect your wallet first");
        setStage("error");
        return;
      }

      setStage("uploading");
      setError("");

      try {
        // Step 1: Upload to Walrus
        const form = new FormData();
        form.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
        if (!uploadRes.ok) throw new Error((await uploadRes.json()).error);
        const { blob_id, content_hash, base64, mime_type } = await uploadRes.json();

        // Step 2: AI Parse — pass base64 directly so AI doesn't need to fetch from Walrus
        setStage("parsing");
        const parseRes = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blob_id, mime_type: mime_type || file.type, base64 }),
        });
        if (!parseRes.ok) throw new Error((await parseRes.json()).error);
        const receiptData: ParsedReceipt = await parseRes.json();
        setParsed(receiptData);

        // Step 3: Mint on Sui via Tatum
        setStage("minting");
        const tx = buildMintTransaction({
          mintCapId: process.env.NEXT_PUBLIC_MINT_CAP_ID!,
          blobId: blob_id,
          storeName: receiptData.store_name,
          purchaseDate: receiptData.purchase_date,
          totalCents: receiptData.total_cents,
          currency: receiptData.currency,
          category: receiptData.category,
          warrantyExpiry: receiptData.warranty_expiry,
          contentHash: content_hash,
        });

        let result: any;
        try {
          result = await signAndExecute({
            transaction: tx,
          });
        } catch (mintErr: any) {
          console.error("Mint error:", mintErr);
          throw new Error(`Mint failed: ${mintErr?.message ?? JSON.stringify(mintErr)}`);
        }

        console.log("Mint result:", JSON.stringify(result, null, 2));

        // Extract object ID from effects or objectChanges
        const objectId =
          result?.effects?.created?.[0]?.reference?.objectId ??
          result?.objectChanges?.find((c: any) => c.type === "created")?.objectId ??
          result?.digest ??
          "";

        // Step 4: Store in Walrus Memory (non-fatal if it fails)
        setStage("storing");
        try {
          await storeReceiptMemory(objectId, blob_id, receiptData);
        } catch (memErr) {
          console.warn("Walrus Memory store failed (non-fatal):", memErr);
        }

        const stored: StoredReceipt = {
          object_id: objectId,
          blob_id,
          blob_url: `${process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR ?? "https://aggregator.walrus.space"}/v1/${blob_id}`,
          parsed: receiptData,
          owner_address: account.address,
          created_at: Date.now(),
          version: 1,
        };

        setStage("done");
        onSuccess(stored);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStage("error");
      }
    },
    [account, signAndExecute, onSuccess],
  );

  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && processFile(files[0]),
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: stage !== "idle" && stage !== "error" && stage !== "done",
  });

  const stageLabel: Record<Stage, string> = {
    idle: "Drop receipt here or click to upload",
    uploading: "Uploading to Walrus...",
    parsing: "AI parsing receipt...",
    minting: "Minting on Sui...",
    storing: "Storing in Walrus Memory...",
    done: "Receipt saved!",
    error: "Upload failed",
  };

  const activeStages: Stage[] = ["uploading", "parsing", "minting", "storing"];

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-violet-400 bg-violet-950/40"
            : "border-violet-700/40 bg-violet-950/20 hover:border-violet-500 hover:bg-violet-950/30",
          stage === "done" && "border-green-500/50 bg-green-950/20",
          stage === "error" && "border-red-500/50 bg-red-950/20",
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {stage === "idle" && (
            <>
              {/* Hidden camera input */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                  e.target.value = "";
                }}
              />

              <div className="flex gap-3">
                {/* Camera button — opens device camera */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 bg-violet-800/40 rounded-xl hover:bg-violet-700/50 transition-colors"
                  title="Take photo with camera"
                >
                  <Camera size={22} className="text-violet-300" />
                  <span className="text-xs text-violet-300">Camera</span>
                </button>

                {/* File browse button */}
                <div className="flex flex-col items-center gap-1.5 p-3 bg-violet-800/40 rounded-xl hover:bg-violet-700/50 transition-colors cursor-pointer">
                  <FileText size={22} className="text-violet-300" />
                  <span className="text-xs text-violet-300">PDF</span>
                </div>

                {/* Upload button */}
                <div className="flex flex-col items-center gap-1.5 p-3 bg-violet-800/40 rounded-xl hover:bg-violet-700/50 transition-colors cursor-pointer">
                  <Upload size={22} className="text-violet-300" />
                  <span className="text-xs text-violet-300">Upload</span>
                </div>
              </div>

              <div>
                <p className="text-gray-200 font-medium">
                  {isDragActive ? "Drop it!" : "Upload a receipt"}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Tap Camera to snap · drag & drop · or click to browse
                </p>
              </div>
            </>
          )}

          {activeStages.includes(stage) && (
            <>
              <Loader2 size={36} className="text-violet-400 animate-spin" />
              <p className="text-violet-200 font-medium">{stageLabel[stage]}</p>
              <div className="flex gap-2 mt-2">
                {activeStages.map((s, i) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1.5 w-12 rounded-full transition-colors",
                      activeStages.indexOf(stage) >= i
                        ? "bg-violet-500"
                        : "bg-violet-800/40",
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {stage === "done" && parsed && (
            <div className="text-center animate-in fade-in duration-500">
              <CheckCircle size={36} className="text-green-400 mx-auto mb-2" />
              <p className="text-green-300 font-semibold">Receipt stored on Sui!</p>
              <p className="text-gray-400 text-sm mt-1">
                {parsed.store_name} · ${(parsed.total_cents / 100).toFixed(2)} · {parsed.category}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStage("idle");
                  setParsed(null);
                }}
                className="mt-4 text-sm text-violet-400 hover:text-violet-300 border border-violet-700/40 rounded-xl px-4 py-1.5 transition-colors"
              >
                + Upload another receipt
              </button>
            </div>
          )}

          {stage === "error" && (
            <div className="text-center">
              <AlertCircle size={36} className="text-red-400 mx-auto mb-2" />
              <p className="text-red-300 font-medium">Upload failed</p>
              <p className="text-gray-400 text-sm mt-1 max-w-xs">{error}</p>
              <button
                onClick={() => setStage("idle")}
                className="mt-3 text-sm text-violet-400 hover:text-violet-300 underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
