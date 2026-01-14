import { fetchSse, tryExtractDeltaText } from "../sse";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export interface StreamChatParams {
  apiBase: string;
  model: string;
  messages: { role: string; content: string }[];
  signal: AbortSignal;
  bufferLength?: number;
  hidden?: boolean;
  toolKeys?: string[];
  debug?: boolean;
  onDeltaText: (delta: string) => void;
}

export async function streamChat({
  apiBase,
  model,
  messages,
  signal,
  bufferLength,
  hidden,
  toolKeys,
  debug,
  onDeltaText
}: StreamChatParams): Promise<void> {
  const url = `${normalizeBaseUrl(apiBase)}/v1/chat/stream`;

  const body: Record<string, unknown> = {
    model,
    messages
  };

  if (typeof bufferLength === "number") body.buffer_length = bufferLength;
  if (typeof hidden === "boolean") body.hidden = hidden;
  if (Array.isArray(toolKeys)) body.tool_keys = toolKeys;

  await fetchSse(
    url,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body),
      signal
    },
    {
      signal,
      debug,
      onEvent: (_raw, data) => {
        const delta = tryExtractDeltaText(data);
        if (delta) onDeltaText(delta);
      }
    }
  );
}
