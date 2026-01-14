# bayer-chatbot-ui

Vite + React UI that talks to the local `bayer-chatbot-service` and uses **SSE passthrough** for streaming.

## Setup

```bash
cd bayer-chatbot-ui
cp .env.example .env
bun install
bun run dev
```

- Ensure the backend is running (default `http://localhost:8787`).
- Set `VITE_API_BASE` in `.env` if needed.

## How Chat Works

- On load, the UI calls `GET /v1/models` to populate the model dropdown.
- On send, it calls `POST /v1/chat/stream` and streams deltas into the last assistant message.
- The full thread history (all messages in the thread) is sent each time.

## Notes

- If the API returns an error during streaming, the assistant message is replaced with `Error: ...`.
- The SSE parser is generic and tries to extract OpenAI-style `choices[0].delta.content` (with fallbacks).
