const PUBLISHER = process.env.WALRUS_PUBLISHER_URL!;
const AGGREGATOR = process.env.WALRUS_AGGREGATOR_URL!;

export interface WalrusUploadResult {
  blob_id: string;
  size: number;
  end_epoch: number;
}

export async function uploadToWalrus(
  file: Buffer | Uint8Array,
  mimeType: string,
  epochs: number = 1,
): Promise<WalrusUploadResult> {
  const res = await fetch(`${PUBLISHER}/v1/blobs?epochs=1`, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: file as unknown as BodyInit,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Walrus upload failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  console.log("Walrus upload response:", JSON.stringify(data, null, 2));

  // Handle different response formats
  const blobId =
    data.newlyCreated?.blobObject?.blobId ??
    data.alreadyCertified?.blobObject?.blobId ??
    data.newlyCreated?.blobId ??
    data.alreadyCertified?.blobId ??
    data.newlyCreated?.id ??
    data.alreadyCertified?.id ??
    data.blobId;

  if (!blobId) throw new Error("Unexpected Walrus response: " + JSON.stringify(data));

  return {
    blob_id: blobId,
    size: data.newlyCreated?.blobObject?.size ?? file.length,
    end_epoch: data.newlyCreated?.blobObject?.storage?.endEpoch ?? 0,
  };
}

export function walrusBlobUrl(blobId: string): string {
  return `${AGGREGATOR}/v1/blobs/${blobId}`;
}

export async function fetchFromWalrus(blobId: string): Promise<Buffer> {
  const res = await fetch(walrusBlobUrl(blobId));
  if (!res.ok) throw new Error(`Walrus fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function sha256Hex(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
