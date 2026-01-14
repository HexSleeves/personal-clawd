# Miso's Workspace 🦊

**Agent**: Miso (Fox)
**User**: HexSleeves (Jacob)
**Timezone**: America/Chicago

## Quick Start

This is Miso's working directory for the Clawdbot AI assistant system.

### On Session Start

1. Read `memory/$(date +%Y-%m-%d).md` (today's log)
2. Read yesterday's log if it exists
3. Review SOUL.md for persona and boundaries
4. Check HEARTBEAT.md for system health

### Core Files

- **IDENTITY.md**: Agent identity and theme
- **SOUL.md**: Persona, boundaries, session workflow
- **USER.md**: User profile and preferences
- **TOOLS.md**: Tool documentation and conventions
- **CAPABILITIES.md**: Complete feature documentation
- **HEARTBEAT.md**: Health monitoring checklist
- **AGENTS.md**: Workspace overview and guidelines

### Directory Structure

```bash
clawd/
├── IDENTITY.md           # Agent identity
├── SOUL.md              # Persona & boundaries
├── USER.md              # User profile
├── TOOLS.md             # Tool documentation
├── CAPABILITIES.md      # Feature documentation
├── HEARTBEAT.md         # Health checklist
├── AGENTS.md            # Workspace guide
├── README.md            # This file
└── memory/              # Daily session logs
    └── YYYY-MM-DD.md    # Date-specific logs
```

## Configuration

Main configuration: `~/.clawdbot/clawdbot.json`

### Performance Settings

- **Agent Timeout**: 5 minutes
- **Concurrent Agents**: 3
- **Retry Attempts**: 3 with exponential backoff
- **Cache TTL**: 1 hour
- **Memory Retention**: 30 days
- **Context Window**: 10 sessions

### Gateway

- **WebSocket Port**: 18789 (loopback)
- **Bridge Port**: 18790 (nodes)
- **Canvas Port**: 18793 (HTML/A2UI)
- **Auth**: Token-based
- **Compression**: Enabled
- **Health Check**: 60s interval

### Messaging

- **Telegram**: Enabled (bot token configured)
- **Platforms**: WhatsApp, Slack, Discord, Signal, iMessage, WebChat
- **Batching**: 100ms delay, 10 batch size
- **No Streaming**: To external surfaces

## Backup Recommendation

Initialize git repo for workspace backup:

```bash
cd ~/clawd
git init
git add .
git commit -m "Initial Miso workspace"
# Add remote and push to private repo
```

## Memory Management

Daily logs track:

- Important decisions and preferences
- Technical learnings
- Configuration changes
- User interactions
- Future enhancements

**Never log**: Tokens, credentials, secrets

Logs older than 30 days should be archived or deleted.

## Health Monitoring

Run heartbeat checks periodically:

- Gateway connection
- Provider auth
- Telegram polling
- Event queue size
- Cache performance
- Disk space

See HEARTBEAT.md for full checklist.

## Development

Install skills via npm:

```bash
# From workspace root
npm install [skill-package]
```

Skills configured in `~/.clawdbot/clawdbot.json`

## Support

- Documentation: <https://docs.clawd.bot/>
- Architecture: <https://docs.clawd.bot/concepts/architecture>
- Workspace guide: AGENTS.md

---

**Last Updated**: 2026-01-12
**Version**: Optimized for performance and helpfulness
