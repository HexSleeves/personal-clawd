import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchSse, tryExtractDeltaText } from "./sseClient";

type ChatRole = "user" | "assistant";

type UiMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function App() {
  const apiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:8787";
  const debug = String(import.meta.env.VITE_DEBUG ?? "").toLowerCase() === "true";

  const [assistantId, setAssistantId] = useState<string>(import.meta.env.VITE_ASSISTANT_ID ?? "");
  const [model, setModel] = useState<string>("gpt-4o-mini");
  const [availableModels, setAvailableModels] = useState<string[] | null>(null);
  const [modelsError, setModelsError] = useState<string>("");
  const [conversationId, setConversationId] = useState<string>("");
  const [hidden, setHidden] = useState<boolean>(true);

  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastRawEvents, setLastRawEvents] = useState<string>("");
  const [lastRequest, setLastRequest] = useState<string>("");
  const [lastStatus, setLastStatus] = useState<string>("");

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isStreaming, [input, isStreaming]);

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        setModelsError("");
        const res = await fetch(`${apiBase.replace(/\/+$/, "")}/v1/models`);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`${res.status} ${res.statusText}${text ? `: ${text.slice(0, 200)}` : ""}`);
        }

        const json = (await res.json()) as any;

        const models: string[] = Array.isArray(json)
          ? json.filter((m: unknown) => typeof m === "string")
          : Array.isArray(json?.data)
            ? json.data
                .map((m: any) => (typeof m === "string" ? m : m?.id))
                .filter((m: unknown) => typeof m === "string")
            : Array.isArray(json?.models)
              ? json.models.filter((m: unknown) => typeof m === "string")
              : [];

        if (cancelled) return;
        setAvailableModels(models.length > 0 ? models : null);

        // If the current model isn't in the list, keep it (don't clobber).
        if (models.length > 0 && !models.includes(model)) {
          // no-op
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setModelsError(msg);
        setAvailableModels(null);
      }
    }

    void loadModels();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  function scrollToBottom() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  async function onSend() {
    if (!canSend) return;

    const userText = input.trim();
    setInput("");

    const userMsg: UiMessage = { id: uid(), role: "user", content: userText };
    const assistantMsgId = uid();
    const assistantMsg: UiMessage = { id: assistantMsgId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setLastRawEvents("");
    setLastStatus("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const body = {
        assistant_id: assistantId || undefined,
        model: assistantId ? undefined : model,
        conversation_id: conversationId || undefined,
        hidden,
        messages: [{ role: "user", content: userText }],
        stream: true
      };

      setLastRequest(JSON.stringify({ url: `${apiBase.replace(/\/+$/, "")}/v1/chat/stream`, body }, null, 2));
      if (debug) console.debug("ui.request", body);

      await fetchSse(
        `${apiBase.replace(/\/+$/, "")}/v1/chat/stream`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal
        },
        {
          debug,
          signal: controller.signal,
          onOpen: (res) => {
            setLastStatus(`${res.status} ${res.statusText}`.trim());
            if (debug) console.debug("ui.sse.open", { status: res.status, statusText: res.statusText });
          },
          onEvent: (raw, data) => {
            setLastRawEvents((prev) => {
              const next = (prev + "\n\n" + raw).trim();
              const lines = next.split("\n");
              return lines.slice(Math.max(0, lines.length - 120)).join("\n");
            });

            const delta = tryExtractDeltaText(data);
            if (delta) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, content: m.content + delta } : m))
              );
              queueMicrotask(scrollToBottom);
            }
          }
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, content: `Error: ${msg}` } : m))
      );
      if (debug) console.debug("ui.error", msg);
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
      queueMicrotask(scrollToBottom);
    }
  }

  function onStop() {
    abortRef.current?.abort();
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div>
            <div className="title">Bayer Chatbot UI</div>
            <div className="subtle">
              SSE passthrough via <span className="pill">{apiBase}</span>
              {debug ? <span className="pill" style={{ marginLeft: 8 }}>debug</span> : null}
            </div>
          </div>
          <div className="subtle">{isStreaming ? "streaming" : "idle"}</div>
        </div>

        <div className="kv">
          <div className="subtle">assistant_id</div>
          <input
            className="input"
            value={assistantId}
            onChange={(e) => setAssistantId(e.target.value)}
            placeholder="UUID (optional)"
          />

          <div className="subtle">model</div>
          {availableModels && assistantId.trim().length === 0 ? (
            <select className="input" value={model} onChange={(e) => setModel(e.target.value)}>
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={
                assistantId.trim().length > 0
                  ? "Disabled when assistant_id is set"
                  : availableModels
                    ? "Select a model"
                    : "Required if assistant_id is empty"
              }
              disabled={assistantId.trim().length > 0}
            />
          )}
          {modelsError ? <div className="subtle">models: {modelsError}</div> : null}

          <div className="subtle">conversation_id</div>
          <input
            className="input"
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
            placeholder="UUID (optional; continue chat)"
          />

          <div className="subtle">hidden</div>
          <label className="subtle">
            <input
              type="checkbox"
              checked={hidden}
              onChange={(e) => setHidden(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Hide conversation from myGenAssist UI
          </label>
        </div>

        <div className="messages" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="subtle">Send a message to start.</div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`msg ${m.role}`}>
                <div className="bubble">{m.content || (m.role === "assistant" ? "…" : "")}</div>
              </div>
            ))
          )}
        </div>

        <div className="composer">
          <div className="row">
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
            />
            <button className="button" disabled={!canSend} onClick={() => void onSend()}>
              Send
            </button>
            <button className="button" disabled={!isStreaming} onClick={onStop}>
              Stop
            </button>
          </div>
        </div>

        <div className="debug">
          <div className="subtle" style={{ marginBottom: 8 }}>
            Debug: last request {lastStatus ? `(status: ${lastStatus})` : ""}
          </div>
          <pre>{lastRequest || "(no request yet)"}</pre>
        </div>

        <div className="debug">
          <div className="subtle" style={{ marginBottom: 8 }}>
            Debug: last SSE events
          </div>
          <pre>{lastRawEvents || "(no events yet)"}</pre>
        </div>
      </div>
    </div>
  );
}
