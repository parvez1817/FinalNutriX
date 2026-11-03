import { useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
};

type ChatAreaProps = {
  messages: ChatMessage[];
};

const SUGGESTIONS = [
  "Analyze my daily nutrition intake",
  "Suggest high-protein meal plans",
  "Compare macronutrients in foods",
  "Calculate my calorie needs",
];

export const ChatArea = ({ messages }: ChatAreaProps) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyChat />;
  }

  return (
    <div className="flex-1 overflow-y-auto chat-scrollbar">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shrink-0 mt-1">
          <Sparkles size={14} className="text-primary-foreground" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-accent/60 text-foreground rounded-br-md"
            : "text-foreground/90",
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="mb-8">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center mx-auto mb-6">
          <Sparkles size={28} className="text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground text-center mb-2">
          How can I help you today?
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Ask me anything about nutrition analysis, meal planning, or food optimization.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="text-left p-3.5 rounded-xl border border-border bg-accent/20 hover:bg-accent/40 text-sm text-muted-foreground hover:text-foreground transition-all duration-150 hover:-translate-y-0.5"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
