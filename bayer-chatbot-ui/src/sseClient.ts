export type SseChunkHandler = (rawEvent: string, data: string) => void;

type SseParseOptions = {
  onEvent: SseChunkHandler;
  signal?: AbortSignal;
  debug?: boolean;
  onOpen?: (res: Response) => void;
};

export async function fetchSse(url: string, init: RequestInit, options: SseParseOptions) {
  if (options.debug) {
    // eslint-disable-next-line no-console
    console.debug("sse.open", { url, method: init.method ?? "GET" });
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      accept: "text/event-stream",
      ...(init.headers ?? {})
    }
  });

  options.onOpen?.(res);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (options.debug) {
      // eslint-disable-next-line no-console
      console.debug("sse.open.error", { status: res.status, statusText: res.statusText, text });
    }
    throw new Error(`SSE request failed: ${res.status} ${res.statusText}: ${text.slice(0, 2000)}`);
  }

  const body = res.body;
  if (!body) throw new Error("SSE response has no body");

  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";

  function findBoundary(input: string): { idx: number; len: number } | null {
    // Handle both \n\n and \r\n\r\n.
    const idxCrlf = input.indexOf("\r\n\r\n");
    const idxLf = input.indexOf("\n\n");

    if (idxCrlf === -1 && idxLf === -1) return null;
    if (idxCrlf !== -1 && (idxLf === -1 || idxCrlf < idxLf)) return { idx: idxCrlf, len: 4 };
    return { idx: idxLf, len: 2 };
  }

  while (true) {
    if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line
    while (true) {
      const boundary = findBoundary(buffer);
      if (!boundary) break;

      const raw = buffer.slice(0, boundary.idx);
      buffer = buffer.slice(boundary.idx + boundary.len);

      const lines = raw.split(/\r?\n/);
      const dataLines = lines
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice("data:".length).trimStart());

      const data = dataLines.join("\n");
      if (options.debug) {
        // eslint-disable-next-line no-console
        console.debug("sse.event", { raw, dataPreview: data.slice(0, 200) });
      }
      options.onEvent(raw, data);

      if (data === "[DONE]") {
        try {
          reader.cancel();
        } catch {
          // ignore
        }
        return;
      }
    }
  }
}

export function tryExtractDeltaText(data: string): string | null {
  if (!data || data === "[DONE]") return null;

  // Supports common OpenAI-style SSE payloads.
  try {
    const json = JSON.parse(data) as any;
    const delta = json?.choices?.[0]?.delta;
    const content = delta?.content;
    if (typeof content === "string") return content;

    const msg = json?.choices?.[0]?.message;
    const full = msg?.content;
    if (typeof full === "string") return full;

    // Fallback for other vendors: sometimes the chunk is { delta: "..." }
    if (typeof json?.delta === "string") return json.delta;
    if (typeof json?.text === "string") return json.text;

    return null;
  } catch {
    // If the server sends plain-text data lines, treat them as the delta.
    return data;
  }
}
