# bayer-chatbot-ui

Vite + React UI that talks to the local `bayer-chatbot-service` and uses **SSE passthrough** for streaming.

## Setup

```bash
cd bayer-chatbot-ui
cp .env.example .env
npm install
npm run dev
```

- Ensure the backend is running (default `http://localhost:8787`).
- Set `VITE_API_BASE` in `.env` if needed.

## Debugging

- Set `VITE_DEBUG=true` to enable extra console logs and show a `debug` badge in the header.
- The UI includes two debug panels:
  - last request (URL + JSON body)
  - last SSE events (raw)

## Notes

- On load, the UI calls `GET /v1/models` to populate the model dropdown (falls back to a freeform text input if it fails).
- `model` is required when `assistant_id` is empty (the platform returns 400 otherwise).
- The UI currently sends only the latest user message (it does not yet replay full history to the backend).
- The SSE parser is generic and tries to extract OpenAI-style `choices[0].delta.content`.
