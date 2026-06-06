import { NextRequest, NextResponse } from "next/server";
import { getOwnedReceipts } from "@/lib/tatum";
import { walrusBlobUrl } from "@/lib/walrus";
import type { StoredReceipt } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  try {
    const objects = await getOwnedReceipts(address);

    const receipts = objects
      .map((obj) => {
        const content = obj.data?.content;
        if (content?.dataType !== "moveObject") return null;

        const fields = content.fields as Record<string, unknown>;

        const parsed = {
          store_name: fields.store_name as string,
          purchase_date: fields.purchase_date as string,
          total_cents: Number(fields.total_cents),
          currency: fields.currency as string,
          category: fields.category as string,
          warranty_expiry: fields.warranty_expiry as string,
          items: [],
          raw_text: "",
          confidence: 1,
        };

        return {
          object_id: obj.data!.objectId,
          blob_id: fields.blob_id as string,
          blob_url: walrusBlobUrl(fields.blob_id as string),
          parsed,
          owner_address: address,
          created_at: Number(fields.created_at),
          version: Number(fields.version),
        } satisfies StoredReceipt;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null) as StoredReceipt[];

    return NextResponse.json({ receipts });
  } catch (err) {
    console.error("Receipts fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fetch failed" },
      { status: 500 },
    );
  }
}
