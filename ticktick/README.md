# TickTick Connector (local)

Local OAuth + tiny CLI for TickTick Open API.

## Docs quick map

- Auth: `https://ticktick.com/oauth/authorize` → code → `https://ticktick.com/oauth/token`
- API host: `api.ticktick.com`
- API base: `https://api.ticktick.com/open/v1`

## Setup

1. In TickTick Developer → Manage Apps, set Redirect URI to:

- `http://127.0.0.1:17821/callback`

2. Export credentials (do not commit them; rotate if leaked):

```bash
export TICKTICK_CLIENT_ID='...'
export TICKTICK_CLIENT_SECRET='...'
```

3. Authorize and store tokens locally:

```bash
node /Users/jacob.lecoq.ext/clawd/ticktick/auth.mjs
```

Tokens are saved to:

- `~/.clawdbot/secrets/ticktick.json`

## Usage

```bash
node /Users/jacob.lecoq.ext/clawd/ticktick/tt.mjs projects
node /Users/jacob.lecoq.ext/clawd/ticktick/tt.mjs tasks --project-id <id>
node /Users/jacob.lecoq.ext/clawd/ticktick/tt.mjs add --project-id <id> --title "Buy milk" --due "2026-01-13T15:00:00-06:00" --tz "America/Chicago"
node /Users/jacob.lecoq.ext/clawd/ticktick/tt.mjs complete --project-id <id> --task-id <id>
```

## Env overrides

- `TICKTICK_API_BASE` (default: `https://api.ticktick.com/open/v1`)
- `TICKTICK_SCOPE` (default: `tasks:read tasks:write`)
- `TICKTICK_REDIRECT_URI` (default: `http://127.0.0.1:17821/callback`)
