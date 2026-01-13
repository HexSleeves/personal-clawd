# bayer-chatbot-service

A small Node.js/TypeScript service that proxies the **myGenAssist Platform API** (`chat.int.bayer.com/api/v2`) into a simpler internal interface.

## Prereqs

- Node.js 18+ (fetch + web streams)
- An access token for the header `x-baychatgpt-accesstoken`

## Setup

```bash
cd bayer-chatbot
cp .env.example .env
# edit .env
npm install
npm run dev
```

## Debugging

Enable structured logs (all optional):

- `LOG_LEVEL=debug|info|warn|error|silent` (default: `info`)
- `DEBUG_HTTP=true` logs request + response metadata
- `DEBUG_HTTP_BODY=true` includes parsed JSON request bodies in logs
- `DEBUG_UPSTREAM=true` logs upstream request/response metadata (token is redacted)

Run with Node inspector:

```bash
npm run dev:inspect
# then open chrome://inspect and attach (port 9229)
```

## Endpoints

- `GET /health`
- `GET /v1/models` → proxies `GET /models`
- `GET /v1/assistants/:assistantId/users` → proxies `GET /assistants/{assistant_id}/users`
- `POST /v1/chat` → non-streaming proxy to `POST /chat/agent`
- `POST /v1/chat/stream` → streaming (SSE) proxy to `POST /chat/agent?buffer_length=...`

### `POST /v1/chat` example

```bash
curl -s \
  -X POST http://localhost:8787/v1/chat \
  -H 'content-type: application/json' \
  -d '{
    "assistant_id": "00000000-0000-0000-0000-000000000000",
    "messages": [{"role":"user","content":"Hello"}],
    "tool_keys": ["document_question_answering"],
    "hidden": true
  }'
```

### `POST /v1/chat/stream` example

```bash
curl -N \
  -X POST http://localhost:8787/v1/chat/stream \
  -H 'content-type: application/json' \
  -d '{
    "assistant_id": "00000000-0000-0000-0000-000000000000",
    "messages": [{"role":"user","content":"Stream this"}],
    "buffer_length": 6,
    "hidden": true
  }'
```

## Next steps

- Add a skill/tool router: intercept tool calls in the response stream and execute internal actions.
- Generate typed client from the OpenAPI spec (optional).
