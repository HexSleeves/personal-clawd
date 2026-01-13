import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { ChatThread } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";

type SidebarProps = {
  threads: ChatThread[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  className?: string;
};

export function Sidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  className
}: SidebarProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => t.title.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q));
  }, [threads, query]);

  return (
    <aside className={cn("flex h-full w-full flex-col", className)} aria-label="Sidebar">
      <div className="space-y-3">
        <Button className="w-full" onClick={onNewChat}>
          New chat
        </Button>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="pl-9"
            aria-label="Search chats"
          />
        </div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1">
        <ScrollArea className="w-full">
          <div className="space-y-1 pr-2">
            {filtered.map((t) => {
              const active = t.id === activeThreadId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectThread(t.id)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left transition-colors",
                    "hover:bg-accent",
                    active ? "bg-accent" : "bg-transparent"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <div className="truncate text-sm font-medium">{t.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{t.preview}</div>
                </button>
              );
            })}

            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">No chats found</div>
            ) : null}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-4 rounded-md border bg-card p-3 text-xs text-muted-foreground">
        Placeholder data • Wired for API later
      </div>
    </aside>
  );
}
