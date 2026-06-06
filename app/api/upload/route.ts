import { NextRequest, NextResponse } from "next/server";
import { sha256Hex } from "@/lib/walrus";

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
    const base64 = Buffer.from(bytes).toString("base64");

    // Upload to Walrus
    const PUBLISHER = process.env.WALRUS_PUBLISHER_URL;
    if (!PUBLISHER) {
      throw new Error("WALRUS_PUBLISHER_URL not configured");
    }

    const walrusRes = await fetch(`${PUBLISHER}/v1/blobs?epochs=1`, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: bytes,
      signal: AbortSignal.timeout(45000), // 45s timeout
    });

    if (!walrusRes.ok) {
      const err = await walrusRes.text();
      throw new Error(`Walrus upload failed: ${walrusRes.status} ${err}`);
    }

    const data = await walrusRes.json();
    console.log("Walrus response:", JSON.stringify(data));

    const blobId =
      data.newlyCreated?.blobObject?.blobId ??
      data.alreadyCertified?.blobObject?.blobId ??
      data.newlyCreated?.blobId ??
      data.alreadyCertified?.blobId ??
      data.blobId;

    if (!blobId) throw new Error("No blob ID in Walrus response: " + JSON.stringify(data));

    return NextResponse.json({
      blob_id: blobId,
      content_hash: contentHash,
      size: bytes.length,
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
