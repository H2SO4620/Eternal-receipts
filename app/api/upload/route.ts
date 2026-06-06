import { NextRequest, NextResponse } from "next/server";
import { uploadToWalrus, sha256Hex } from "@/lib/walrus";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentHash = await sha256Hex(bytes);

    // Upload to Walrus
    const result = await uploadToWalrus(bytes, file.type, 1);

    // Also return base64 so AI can parse immediately without waiting for Walrus certification
    const base64 = Buffer.from(bytes).toString("base64");

    return NextResponse.json({
      blob_id: result.blob_id,
      content_hash: contentHash,
      size: result.size,
      end_epoch: result.end_epoch,
      base64,
      mime_type: file.type,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
