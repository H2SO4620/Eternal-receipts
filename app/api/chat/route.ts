import { NextRequest } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { queryReceiptMemory } from "@/lib/walrus-memory";

export const runtime = "nodejs";
export const maxDuration = 60;

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: NextRequest) {
  const { messages, ownerAddress } = await req.json();
  const lastMessage = messages[messages.length - 1]?.content ?? "";

  const memoryResults = await queryReceiptMemory(lastMessage, 8);

  const context =
    memoryResults.length > 0
      ? `\n\nRelevant receipts from the user's history:\n${memoryResults
          .map((r, i) => `${i + 1}. [Score: ${r.score.toFixed(2)}] ${r.content}`)
          .join("\n")}`
      : "\n\nNo relevant receipts found in Walrus Memory.";

  const systemPrompt = `You are EternalReceipts AI, a helpful assistant that answers questions about the user's purchase history.

You have access to the user's receipt data stored in Walrus Memory — a permanent, tamper-proof decentralized storage system on the Sui blockchain.

Answer questions accurately based on the receipts provided. If asked about spending totals, calculate them. If asked about warranties, check the warranty_expiry dates. Be concise and helpful.

Today's date: ${new Date().toISOString().split("T")[0]}
User wallet: ${ownerAddress ?? "not connected"}
${context}`;

  const result = streamText({
    model: openrouter(process.env.AI_MODEL ?? "google/gemini-flash-1.5"),
    system: systemPrompt,
    messages,
    maxTokens: 1024,
  });

  return result.toDataStreamResponse();
}
