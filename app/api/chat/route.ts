import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { queryReceiptMemory } from "@/lib/walrus-memory";

export const runtime = "nodejs";
export const maxDuration = 60;

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, ownerAddress } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content ?? "";

    const memoryResults = await queryReceiptMemory(lastMessage, 8);

    const context =
      memoryResults.length > 0
        ? `\n\nRelevant receipts from the user's history:\n${memoryResults
            .map((r, i) => `${i + 1}. ${r.content}`)
            .join("\n")}`
        : "\n\nNo relevant receipts found in Walrus Memory.";

    const systemPrompt = `You are EternalReceipts AI, a helpful assistant that answers questions about the user's purchase history.

You have access to the user's receipt data stored on Walrus decentralized storage on the Sui blockchain.

Answer questions accurately. If asked about spending totals, calculate them. If asked about warranties, check the warranty_expiry dates. Be concise and helpful.

Today's date: ${new Date().toISOString().split("T")[0]}
User wallet: ${ownerAddress ?? "not connected"}
${context}`;

    // Convert messages to simple prompt format
    const conversationHistory = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      )
      .join("\n");

    const { text } = await generateText({
      model: openrouter(process.env.AI_MODEL ?? "google/gemini-3.5-flash"),
      prompt: `${systemPrompt}\n\nConversation:\n${conversationHistory}\n\nAssistant:`,
    });

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 500 },
    );
  }
}
