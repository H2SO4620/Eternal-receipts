const MEMORY_BASE = "https://memory.walrus.space/v1";
const API_KEY = process.env.WALRUS_MEMORY_API_KEY!;
const NAMESPACE = process.env.WALRUS_MEMORY_NAMESPACE ?? "eternal-receipts";

interface MemoryEntry {
  key: string;
  content: string;
  metadata: Record<string, unknown>;
}

interface MemorySearchResult {
  key: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

function headers() {
  return {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function storeReceiptMemory(
  objectId: string,
  blobId: string,
  parsed: import("./types").ParsedReceipt,
): Promise<void> {
  const content = buildMemoryContent(parsed);

  await fetch(`${MEMORY_BASE}/namespaces/${NAMESPACE}/entries`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      key: `receipt:${objectId}`,
      content,
      metadata: {
        object_id: objectId,
        blob_id: blobId,
        store_name: parsed.store_name,
        purchase_date: parsed.purchase_date,
        total_cents: parsed.total_cents,
        currency: parsed.currency,
        category: parsed.category,
        warranty_expiry: parsed.warranty_expiry,
      },
    } satisfies MemoryEntry),
  });
}

export async function queryReceiptMemory(
  query: string,
  topK: number = 10,
): Promise<MemorySearchResult[]> {
  const res = await fetch(`${MEMORY_BASE}/namespaces/${NAMESPACE}/search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query, top_k: topK }),
  });

  if (!res.ok) {
    console.error("Walrus Memory search failed:", await res.text());
    return [];
  }

  const data = await res.json();
  return data.results ?? [];
}

export async function deleteReceiptMemory(objectId: string): Promise<void> {
  await fetch(
    `${MEMORY_BASE}/namespaces/${NAMESPACE}/entries/receipt:${objectId}`,
    { method: "DELETE", headers: headers() },
  );
}

function buildMemoryContent(parsed: import("./types").ParsedReceipt): string {
  const items = parsed.items
    .map((i) => `${i.name} ($${(i.price_cents / 100).toFixed(2)})`)
    .join(", ");

  return [
    `Receipt from ${parsed.store_name} on ${parsed.purchase_date}.`,
    `Total: $${(parsed.total_cents / 100).toFixed(2)} ${parsed.currency}.`,
    `Category: ${parsed.category}.`,
    items ? `Items purchased: ${items}.` : "",
    parsed.warranty_expiry ? `Warranty expires: ${parsed.warranty_expiry}.` : "No warranty.",
    parsed.raw_text ? `Full text: ${parsed.raw_text.slice(0, 500)}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
