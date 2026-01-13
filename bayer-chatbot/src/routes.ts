import type { Express, Request, Response } from "express";
import { z } from "zod";
import { BayerChatClient } from "./bayerClient.js";
import { pipeSse } from "./sse.js";
import type { Logger } from "./logger.js";

const RoleSchema = z.enum(["system", "user", "assistant", "tool"]);

const MessageSchema = z.object({
  role: RoleSchema,
  content: z.string()
});

const ChatRequestSchema = z.object({
  assistant_id: z.string().uuid().optional(),
  conversation_id: z.string().optional(),
  hidden: z.boolean().optional(),
  tool_keys: z.array(z.string()).optional(),
  buffer_length: z.number().int().min(1).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  stream: z.boolean().optional(),
  messages: z.array(MessageSchema).min(1)
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

function toAgentMessages(messages: ChatRequest["messages"]) {
  // The API schema references MessageWithMetadata, but role+content works for most uses.
  // We add minimal metadata to be safe.
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
    metadata: {}
  }));
}

type AsyncRoute = (req: Request, res: Response) => Promise<void>;

function getRequestId(req: Request): string | undefined {
  return (req as any).requestId ?? (typeof req.headers["x-request-id"] === "string" ? req.headers["x-request-id"] : undefined);
}

function asyncRoute(logger: Logger | undefined, fn: AsyncRoute) {
  return (req: Request, res: Response) => {
    fn(req, res).catch((err: unknown) => {
      const requestId = getRequestId(req);
      const message = err instanceof Error ? err.message : String(err);
      logger?.error("route.error", {
        requestId,
        method: req.method,
        path: req.originalUrl,
        message
      });
      res.status(502).json({ error: "upstream_error", message, requestId });
    });
  };
}

export function mountRoutes(app: Express, client: BayerChatClient, logger?: Logger) {
  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // List available models (OpenAI-compatible shape is commonly GET /models)
  app.get(
    "/v1/models",
    asyncRoute(logger, async (req, res) => {
      const requestId = getRequestId(req);
      const data = await client.request<unknown>("/models", {
        method: "GET",
        headers: requestId ? { "x-request-id": requestId } : undefined
      });
      res.status(data.status).json(data.json);
    })
  );

  // Convenience proxy for the documented endpoint in your link
  app.get(
    "/v1/assistants/:assistantId/users",
    asyncRoute(logger, async (req, res) => {
      const assistantId = req.params.assistantId;
      const requestId = getRequestId(req);

      const data = await client.request<unknown>(`/assistants/${assistantId}/users`, {
        method: "GET",
        headers: requestId ? { "x-request-id": requestId } : undefined
      });

      res.status(data.status).json(data.json);
    })
  );

  // Non-streaming chat against /chat/agent
  app.post(
    "/v1/chat",
    asyncRoute(logger, async (req: Request, res: Response) => {
      const parsed = ChatRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
        return;
      }

      const input = parsed.data;
      if (!input.assistant_id && !input.model) {
        res.status(400).json({ error: "invalid_request", message: "Provide either assistant_id or model" });
        return;
      }

      const upstreamBody = {
        ...input,
        stream: false,
        messages: toAgentMessages(input.messages)
      };

      const requestId = getRequestId(req);

      const upstream = await client.request<unknown>("/chat/agent", {
        method: "POST",
        headers: requestId ? { "x-request-id": requestId } : undefined,
        body: JSON.stringify(upstreamBody)
      });

      res.status(upstream.status).json(upstream.json);
    })
  );

  // Streaming chat proxy: returns SSE as-is
  app.post(
    "/v1/chat/stream",
    asyncRoute(logger, async (req: Request, res: Response) => {
      const parsed = ChatRequestSchema.safeParse({ ...req.body, stream: true });
      if (!parsed.success) {
        res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
        return;
      }

      const input = parsed.data;
      if (!input.assistant_id && !input.model) {
        res.status(400).json({ error: "invalid_request", message: "Provide either assistant_id or model" });
        return;
      }

      const upstreamBody = {
        ...input,
        stream: true,
        messages: toAgentMessages(input.messages)
      };

      const requestId = getRequestId(req);

      const upstream = await client.requestSse(
        "/chat/agent",
        upstreamBody,
        {
          buffer_length: input.buffer_length
        },
        requestId ? { "x-request-id": requestId } : {}
      );

      await pipeSse(upstream, res);
    })
  );
}
