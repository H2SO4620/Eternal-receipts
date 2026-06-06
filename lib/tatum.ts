import { SuiClient } from "@mysten/sui/client";
// @ts-ignore - use dapp-kit's bundled version to avoid version mismatch
import { Transaction } from "@mysten/sui/transactions";

const TATUM_RPC = process.env.NEXT_PUBLIC_TATUM_RPC!;
const TATUM_KEY = process.env.TATUM_API_KEY!;

export function getTatumSuiClient(): SuiClient {
  return new SuiClient({ url: TATUM_RPC });
}

export async function getOwnedReceipts(ownerAddress: string) {
  const client = getTatumSuiClient();
  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID!;

  const objects = await client.getOwnedObjects({
    owner: ownerAddress,
    ...(packageId && {
      filter: { StructType: `${packageId}::receipt::PurchaseReceipt` },
    }),
    options: { showContent: true, showType: true },
  });

  return objects.data;
}

export async function getReceiptObject(objectId: string) {
  const client = getTatumSuiClient();
  return client.getObject({
    id: objectId,
    options: { showContent: true, showType: true, showOwner: true },
  });
}

export function buildMintTransaction(params: {
  mintCapId: string;
  blobId: string;
  storeName: string;
  purchaseDate: string;
  totalCents: number;
  currency: string;
  category: string;
  warrantyExpiry: string;
  contentHash: string;
}): Transaction {
  const tx = new Transaction();
  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID!;
  const encoder = new TextEncoder();

  tx.moveCall({
    target: `${packageId}::receipt::mint_receipt`,
    arguments: [
      tx.object(params.mintCapId),
      tx.pure.vector("u8", Array.from(encoder.encode(params.blobId))),
      tx.pure.vector("u8", Array.from(encoder.encode(params.storeName))),
      tx.pure.vector("u8", Array.from(encoder.encode(params.purchaseDate))),
      tx.pure.u64(BigInt(params.totalCents)),
      tx.pure.vector("u8", Array.from(encoder.encode(params.currency))),
      tx.pure.vector("u8", Array.from(encoder.encode(params.category))),
      tx.pure.vector("u8", Array.from(encoder.encode(params.warrantyExpiry))),
      tx.pure.vector("u8", Array.from(encoder.encode(params.contentHash))),
      tx.pure.u64(BigInt(Date.now())),
    ],
  });

  return tx;
}
