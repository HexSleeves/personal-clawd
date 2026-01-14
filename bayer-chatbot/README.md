# bayer-chatbot-service (Go)

A small Go (stdlib `net/http`) service that proxies the **myGenAssist Platform API** (`chat.int.bayer.com/api/v2`) into a simpler internal interface.

This folder previously contained a Node.js/TypeScript implementation; the Go server is now the primary runtime.

## Prereqs

- Go toolchain (compatible with Go 1.15-era features; no generics/`embed`)
- An access token for the header `x-baychatgpt-accesstoken`

## Setup

```bash
cd bayer-chatbot
cp .env.example .env
# edit .env

go run ./cmd/bayer-chatbot-service
```

Build a binary:

```bash
go build -o bayer-chatbot-service ./cmd/bayer-chatbot-service
./bayer-chatbot-service
```

## Debugging

Enable structured logs (all optional):

- `LOG_LEVEL=debug|info|warn|error|silent` (default: `info`)
- `DEBUG_HTTP=true` logs request + response metadata
- `DEBUG_UPSTREAM=true` logs upstream request/response metadata (token is redacted)

Notes:

- The Go version intentionally uses only the standard library (no external logging/router deps).
- If you want interactive debugging, attach `dlv` manually (not bundled).

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
