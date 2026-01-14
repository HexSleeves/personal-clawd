import React, { useCallback, useMemo, useRef } from "react";
import { Send, Square } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  className?: string;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
  className
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = useMemo(
    () => value.trim().length > 0 && !disabled && !isStreaming,
    [value, disabled, isStreaming]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (canSend) onSend();
      }
    },
    [canSend, onSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div
      className={cn(
        "border-t bg-background/80 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          className="min-h-[44px] resize-none rounded-2xl"
          rows={1}
        />

        {isStreaming ? (
          <Button
            variant="secondary"
            size="icon"
            onClick={onStop}
            aria-label="Stop generating"
            disabled={!onStop}
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="icon" onClick={onSend} aria-label="Send message" disabled={!canSend}>
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="mx-auto mt-2 max-w-3xl text-xs text-muted-foreground">
        Enter to send • Shift+Enter for newline
      </p>
    </div>
  );
}
