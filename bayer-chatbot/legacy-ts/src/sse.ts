export type SseEvent = {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
};

export async function pipeSse(upstream: Response, res: import("express").Response): Promise<void> {
  res.status(200);
  res.setHeader("content-type", "text/event-stream");
  res.setHeader("cache-control", "no-cache, no-transform");
  res.setHeader("connection", "keep-alive");

  const body = upstream.body;
  if (!body) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: "Upstream returned no body" })}\n\n`);
    res.end();
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
    res.end();
  }
}
