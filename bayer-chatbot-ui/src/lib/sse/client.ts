import type { AlternativeChunk, OpenAIChatChunk, SseParseOptions, StreamingChunk } from "./types";

const DONE_SIGNAL = "[DONE]";

interface EventBoundary {
  idx: number;
  len: number;
}

/**
 * Find the next event boundary in the buffer
 * Handles both \n\n and \r\n\r\n separators
 */
function findEventBoundary(input: string): EventBoundary | null {
  const idxCrlf = input.indexOf("\r\n\r\n");
  const idxLf = input.indexOf("\n\n");

  if (idxCrlf === -1 && idxLf === -1) return null;
  if (idxCrlf !== -1 && (idxLf === -1 || idxCrlf < idxLf)) {
    return { idx: idxCrlf, len: 4 };
  }
  return { idx: idxLf, len: 2 };
}

/**
 * Parse SSE data lines from raw event text
 */
function parseDataLines(raw: string): string {
  const lines = raw.split(/\r?\n/);
  return lines
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trimStart())
    .join("\n");
}

/**
 * Fetch and parse Server-Sent Events stream
 */
export async function fetchSse(url: string, init: RequestInit, options: SseParseOptions): Promise<void> {
  if (options.debug) {
    console.debug("sse.open", { url, method: init.method ?? "GET" });
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      accept: "text/event-stream",
      ...init.headers
    }
  });

  options.onOpen?.(res);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (options.debug) {
      console.debug("sse.error", { status: res.status, statusText: res.statusText, text });
    }
    throw new Error(`SSE request failed: ${res.status} ${res.statusText}: ${text.slice(0, 2000)}`);
  }

  const body = res.body;
  if (!body) throw new Error("SSE response has no body");

  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      if (options.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete events
      while (true) {
        const boundary = findEventBoundary(buffer);
        if (!boundary) break;

        const raw = buffer.slice(0, boundary.idx);
        buffer = buffer.slice(boundary.idx + boundary.len);

        const data = parseDataLines(raw);

        if (options.debug) {
          console.debug("sse.event", { raw, dataPreview: data.slice(0, 200) });
        }

        options.onEvent(raw, data);

        if (data === DONE_SIGNAL) {
          await reader.cancel();
          return;
        }
      }
    }
  } finally {
    // Ensure reader is released
    try {
      reader.releaseLock();
    } catch {
      // Ignore if already released
    }
  }
}

/**
 * Type guard for OpenAI-style chunks
 */
function isOpenAIChunk(json: StreamingChunk): json is OpenAIChatChunk {
  return "choices" in json && Array.isArray(json.choices);
}

/**
 * Type guard for alternative chunk formats
 */
function isAlternativeChunk(json: StreamingChunk): json is AlternativeChunk {
  return "delta" in json || "text" in json;
}

/**
 * Extract delta text from various streaming payload formats
 * Supports OpenAI-style and common alternatives
 */
export function tryExtractDeltaText(data: string): string | null {
  if (!data || data === DONE_SIGNAL) return null;

  try {
    const json = JSON.parse(data) as StreamingChunk;

    // OpenAI-style: { choices: [{ delta: { content: "..." } }] }
    if (isOpenAIChunk(json)) {
      const choice = json.choices?.[0];
      const deltaContent = choice?.delta?.content;
      if (typeof deltaContent === "string") return deltaContent;

      const messageContent = choice?.message?.content;
      if (typeof messageContent === "string") return messageContent;
    }

    // Alternative formats: { delta: "..." } or { text: "..." }
    if (isAlternativeChunk(json)) {
      if (typeof json.delta === "string") return json.delta;
      if (typeof json.text === "string") return json.text;
    }

    return null;
  } catch {
    // If parsing fails, treat as plain text
    return data;
  }
}
