import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

const ReceiptSchema = z.object({
  store_name: z.string().describe("Name of the store or merchant"),
  purchase_date: z.string().describe("Purchase date in ISO format YYYY-MM-DD"),
  total_cents: z.number().int().describe("Total amount in cents (e.g. $49.99 = 4999)"),
  currency: z.string().default("USD").describe("3-letter currency code"),
  category: z
    .enum([
      "Electronics",
      "Groceries",
      "Restaurant",
      "Clothing",
      "Healthcare",
      "Travel",
      "Home",
      "Entertainment",
      "Automotive",
      "Other",
    ])
    .describe("Best-fit spending category"),
  warranty_expiry: z
    .string()
    .describe("Warranty expiry date YYYY-MM-DD, or empty string if none"),
  items: z.array(
    z.object({
      name: z.string(),
      price_cents: z.number().int(),
      quantity: z.number().int().default(1),
    }),
  ),
  raw_text: z.string().describe("All text visible on the receipt"),
  confidence: z.number().min(0).max(1),
});

const PARSE_PROMPT = `You are a receipt OCR expert. Extract ALL information from this receipt image with high accuracy.

Rules:
- Dates must be in ISO format (YYYY-MM-DD). If year is ambiguous, use current year 2026.
- Amounts must be in cents (integer). $49.99 → 4999.
- If warranty info is present (common on electronics receipts), extract the expiry date.
- Category should reflect the primary purchase type.
- List every line item you can read.
- raw_text should capture all visible text on the receipt.
- confidence: 0.9+ if text is clear, 0.6-0.9 if partially blurry, <0.6 if very unclear.`;

export async function POST(req: NextRequest) {
  try {
    const { blob_id, mime_type, base64 } = await req.json();

    if (!blob_id) {
      return NextResponse.json({ error: "blob_id required" }, { status: 400 });
    }

    // For PDFs, send as PDF directly — Gemini supports PDF input
    const mimeTypeClean = mime_type || "image/jpeg";
    const imageData = base64
      ? `data:${mimeTypeClean};base64,${base64}`
      : null;

    if (!imageData) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: openrouter(process.env.AI_MODEL ?? "moonshotai/kimi-k2.6:free"),
      schema: ReceiptSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: imageData,
            },
            {
              type: "text",
              text: PARSE_PROMPT,
            },
          ],
        },
      ],
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("Parse error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Parse failed" },
      { status: 500 },
    );
  }
}
