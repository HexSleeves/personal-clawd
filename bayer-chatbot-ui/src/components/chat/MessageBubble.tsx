import React, { memo } from "react";

import type { ChatMessage } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="mt-1 shrink-0">
          <AvatarFallback aria-label="Assistant avatar">A</AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>

      {isUser && (
        <Avatar className="mt-1 shrink-0">
          <AvatarFallback aria-label="User avatar">U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});
