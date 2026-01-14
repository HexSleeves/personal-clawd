import React, { useEffect, useMemo, useRef } from "react";

import type { ChatMessage } from "../../lib/types";
import { ScrollArea } from "../ui/scroll-area";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages]
  );

  // Track the last message content length for auto-scroll during streaming
  const lastMessageLength = sorted.at(-1)?.content.length ?? 0;

  useEffect(() => {
    // Scroll to bottom when messages change or content is appended (streaming)
    endRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [sorted.length, lastMessageLength]);

  return (
    <ScrollArea className="h-full">
      <div className="px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {sorted.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          <div ref={endRef} aria-hidden="true" />
        </div>
      </div>
    </ScrollArea>
  );
}
