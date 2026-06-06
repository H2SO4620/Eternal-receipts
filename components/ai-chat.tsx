"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { Send, Bot, Loader2 } from "lucide-react";
import { useRef, useEffect, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Show all electronics purchases",
  "What's my total spending this month?",
  "Which warranties are expiring soon?",
  "What's my average grocery spend?",
];

export function AIChat() {
  const account = useCurrentAccount();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          ownerAddress: account?.address,
        }),
      });

      const data = await res.json();
      console.log("Chat response:", data);

      if (!res.ok) {
        setMessages([...newMessages, { role: "assistant", content: `Error: ${data.error ?? res.status}` }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: data.text ?? "No response from AI." }]);
      }
    } catch (err) {
      console.error("Chat fetch error:", err);
      setMessages([...newMessages, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className="flex flex-col h-[500px] bg-gray-900/60 border border-gray-700/50 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/50">
        <div className="p-1.5 bg-violet-800/40 rounded-lg">
          <Bot size={16} className="text-violet-300" />
        </div>
        <span className="text-sm font-medium text-gray-200">AI Receipt Assistant</span>
        <span className="ml-auto text-xs text-gray-500">Built on Walrus + Sui</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm mb-4">Ask anything about your receipts</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-violet-900/40 border border-violet-700/40 text-violet-300 rounded-full px-3 py-1.5 hover:bg-violet-800/40 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-violet-700/60 text-white rounded-br-sm"
                  : "bg-gray-800/80 text-gray-200 rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800/80 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <Loader2 size={14} className="text-gray-400 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700/50 flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about your receipts..."
          className="flex-1 bg-gray-800/60 border border-gray-600/40 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500/60"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="p-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 rounded-xl transition-colors"
        >
          <Send size={14} className="text-white" />
        </button>
      </form>
    </div>
  );
}
