export interface ParsedReceipt {
  store_name: string;
  purchase_date: string;
  total_cents: number;
  currency: string;
  category: string;
  warranty_expiry: string;
  items: LineItem[];
  raw_text: string;
  confidence: number;
}

export interface LineItem {
  name: string;
  price_cents: number;
  quantity: number;
}

export interface StoredReceipt {
  object_id: string;
  blob_id: string;
  blob_url: string;
  parsed: ParsedReceipt;
  owner_address: string;
  created_at: number;
  version: number;
}

export interface SpendingStats {
  total_cents: number;
  by_category: Record<string, number>;
  by_month: { month: string; total_cents: number }[];
  receipt_count: number;
}
