import React, { useCallback, useState } from "react";

import { useChat, useModels } from "../hooks";
import { API_BASE_DEFAULT, DEFAULT_MODEL } from "../lib/constants";
import { MessageInput } from "../components/chat/MessageInput";
import { MessageList } from "../components/chat/MessageList";
import { Sidebar } from "../components/layout/Sidebar";
import { TopBar } from "../components/layout/TopBar";
import { Sheet, SheetContent } from "../components/ui/sheet";

export function ChatPage() {
  const apiBase = import.meta.env.VITE_API_BASE ?? API_BASE_DEFAULT;

  const [model, setModel] = useState(DEFAULT_MODEL);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { models, error: modelsError } = useModels(apiBase);

  const {
    threads,
    activeThread,
    input,
    isStreaming,
    setInput,
    onNewChat,
    onSend,
    onStop,
    onSelectThread: selectThread
  } = useChat({ apiBase, model });

  const onSelectThread = useCallback(
    (id: string) => {
      selectThread(id);
      setSidebarOpen(false);
    },
    [selectThread]
  );

  const onOpenSidebar = useCallback(() => setSidebarOpen(true), []);

  if (!activeThread) return null;

  return (
    <div className="flex h-dvh w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden w-[340px] shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="p-4">
          <div className="text-sm font-semibold">t3-inspired chat</div>
          <div className="text-xs text-muted-foreground">Bayer proxy demo UI</div>
        </div>
        <div className="flex min-h-0 flex-1 px-3 pb-3">
          <Sidebar
            threads={threads}
            activeThreadId={activeThread.id}
            onSelectThread={onSelectThread}
            onNewChat={onNewChat}
          />
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="md:hidden">
          <Sidebar
            threads={threads}
            activeThreadId={activeThread.id}
            onSelectThread={onSelectThread}
            onNewChat={onNewChat}
          />
        </SheetContent>
      </Sheet>

      {/* Main chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={activeThread.title}
          subtitle={`API: ${apiBase}`}
          onOpenSidebar={onOpenSidebar}
          model={model}
          models={models}
          modelsError={modelsError}
          onChangeModel={setModel}
        />

        <main className="min-h-0 flex-1">
          <MessageList messages={activeThread.messages} />
        </main>

        <MessageInput
          value={input}
          onChange={setInput}
          onSend={onSend}
          onStop={onStop}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
