import { useCallback, useMemo, useRef, useState } from "react";

import { streamChat } from "../lib/api";
import { uid } from "./useUid";
import type { ChatMessage, ChatThread } from "../lib/types";

interface UseChatOptions {
  apiBase: string;
  initialThreads?: ChatThread[];
  model: string;
}

interface UseChatResult {
  threads: ChatThread[];
  activeThread: ChatThread;
  activeThreadId: string;
  input: string;
  isStreaming: boolean;
  setInput: (value: string) => void;
  setActiveThreadId: (id: string) => void;
  onNewChat: () => void;
  onSelectThread: (id: string) => void;
  onSend: () => void;
  onStop: () => void;
}

function createEmptyThread(): ChatThread {
  return {
    id: `t-${uid()}`,
    title: "New chat",
    preview: "",
    updatedAt: Date.now(),
    messages: []
  };
}

function toApiMessages(messages: ChatMessage[]): { role: string; content: string }[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));
}

export function useChat({ apiBase, initialThreads, model }: UseChatOptions): UseChatResult {
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    if (initialThreads && initialThreads.length) return initialThreads;
    return [createEmptyThread()];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(() => threads[0]?.id ?? "");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const activeThread = useMemo(() => {
    const found = threads.find((t) => t.id === activeThreadId);
    return found ?? threads[0];
  }, [threads, activeThreadId]);

  const onNewChat = useCallback(() => {
    const thread = createEmptyThread();
    setThreads((prev) => [thread, ...prev]);
    setActiveThreadId(thread.id);
  }, []);

  const onSelectThread = useCallback((id: string) => {
    setActiveThreadId(id);
  }, []);

  const appendMessageContent = useCallback((threadId: string, messageId: string, text: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        return {
          ...t,
          messages: t.messages.map((m) => (m.id === messageId ? { ...m, content: m.content + text } : m))
        };
      })
    );
  }, []);

  const replaceAssistantMessage = useCallback((threadId: string, messageId: string, content: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        return {
          ...t,
          messages: t.messages.map((m) => (m.id === messageId ? { ...m, content } : m))
        };
      })
    );
  }, []);

  const onSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const thread = activeThread ?? threads[0] ?? createEmptyThread();

    const userMsg: ChatMessage = {
      id: `m-${uid()}`,
      role: "user",
      content: text,
      createdAt: Date.now()
    };

    const assistantMsg: ChatMessage = {
      id: `m-${uid()}`,
      role: "assistant",
      content: "",
      createdAt: Date.now() + 1
    };

    setInput("");
    setIsStreaming(true);

    // Update thread with new messages
    setThreads((prev) => {
      const exists = prev.some((t) => t.id === thread.id);
      const nextThreads = exists ? prev : [thread, ...prev];

      return nextThreads.map((t) =>
        t.id === thread.id
          ? {
              ...t,
              title: t.title === "New chat" ? text.slice(0, 48) : t.title,
              preview: text,
              updatedAt: Date.now(),
              messages: [...t.messages, userMsg, assistantMsg]
            }
          : t
      );
    });

    setActiveThreadId(thread.id);

    // Abort any existing stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    void (async () => {
      try {
        await streamChat({
          apiBase,
          model,
          messages: toApiMessages([...(thread.messages ?? []), userMsg]),
          signal: controller.signal,
          bufferLength: 6,
          hidden: true,
          onDeltaText: (delta) => {
            appendMessageContent(thread.id, assistantMsg.id, delta);
          }
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        const message = err instanceof Error ? err.message : String(err);
        replaceAssistantMessage(thread.id, assistantMsg.id, `Error: ${message}`);
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsStreaming(false);
      }
    })();
  }, [activeThread, apiBase, appendMessageContent, input, isStreaming, model, replaceAssistantMessage, threads]);

  const onStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    threads,
    activeThread,
    activeThreadId: activeThreadId || activeThread.id,
    input,
    isStreaming,
    setInput,
    setActiveThreadId,
    onNewChat,
    onSelectThread,
    onSend,
    onStop
  };
}
