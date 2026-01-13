# TOOLS.md - Tool Documentation & Conventions

This file documents external tools and conventions for Clawdbot.
Clawdbot provides built-in tools internally; this is for your custom integrations.

## Built-in Tools Overview

### Gateway Protocol

- **WebSocket API**: Control plane for macOS app, CLI, web UI, automations
- **Bridge Protocol**: TCP JSONL for nodes (macOS/iOS/Android)
- **Canvas Host**: Serves agent-editable HTML and A2UI on port 18793
- **Authentication**: Token-based auth for secure connections
- **Idempotency**: Required keys for side-effecting methods (send, agent)

### Agent Operations

- **agent**: Run AI agent with specified prompt and context
- **health**: Check gateway and provider connection health
- **status**: Get current system status and metrics
- **send**: Send messages to chat surfaces
- **system-presence**: Update system presence status

### Event Subscriptions

- **tick**: Regular heartbeat events
- **agent**: Agent execution progress and completion
- **presence**: User/system presence updates
- **chat**: Incoming chat messages
- **cron**: Scheduled job execution
- **heartbeat**: System health checks
- **shutdown**: Gateway shutdown notifications

## External Tool Integrations

### imsg (iMessage/SMS)

- **Purpose**: Send iMessages and SMS from macOS
- **Usage**: Describe recipient and message content
- **Confirm**: Always confirm before sending
- **Best Practices**:
  - Keep messages short and clear
  - Never send secrets or sensitive data
  - Verify recipient before sending
  - Use for time-sensitive notifications

### sag (Text-to-Speech)

- **Purpose**: Text-to-speech output to speakers/rooms
- **Usage**: Specify voice, target speaker/room, and streaming mode
- **Best Practices**:
  - Choose appropriate voice for context
  - Consider room/time before playing
  - Use for ambient notifications or alerts

## Performance Best Practices

### WebSocket Connections

- Use compression for large payloads (enabled by default)
- Implement exponential backoff for reconnections
- Batch events when possible (100ms batch delay)
- Keep payload sizes under 10MB

### Agent Execution

- Set reasonable timeouts (default: 5 minutes)
- Use retry logic with exponential backoff (3 retries max)
- Limit concurrent executions (default: 3)
- Cache frequent requests (1-hour TTL)

### Event Processing

- Queue events for batch processing (max 1000, flush every 100ms)
- Subscribe only to needed event types
- Handle missing events gracefully (no replay)
- Maintain sequence tracking for critical events

### Cron Jobs

- Keep job execution lightweight
- Use heartbeat for health monitoring
- Log job results to memory/
- Implement job timeout and retry logic

## Node Integration (Bridge Protocol)

### Available Commands

- **canvas.*** : Canvas manipulation commands
- **camera.*** : Camera access and capture
- **screen.record**: Screen recording
- **location.get**: Location services

### Pairing Workflow

1. Connect to bridge (TCP JSONL on port 18790)
2. Pair with gateway to receive token
3. Execute commands via bridge protocol
4. Handle responses and errors

## Local Toolchain

### Development Tools

- **Node.js**: npm for skill installation
- **Git**: Version control for workspace backup
- **SSH**: Tunneling for remote access (port 18789)
- **Tailscale**: VPN alternative for remote access (currently disabled)

### Memory Management

- **Daily Logs**: memory/YYYY-MM-DD.md format
- **Retention**: 30 days configured
- **Context Window**: Last 10 sessions
- **On Session Start**: Read today + yesterday

### Health Monitoring

- **Interval**: Check every 60 seconds
- **Timeout**: 5 second threshold
- **Heartbeat**: Custom checklist in HEARTBEAT.md
- **Logging**: Results logged to logs/

## Custom Conventions

### Message Formatting

- Use markdown for rich text
- Keep external messages concise (< 500 chars recommended)
- Use emojis sparingly and contextually
- Format code blocks with language tags

### Error Handling

- Log all errors to workspace logs
- Use structured error messages
- Implement graceful degradation
- Notify user on critical failures

### Security

- Never log tokens or credentials
- Validate all external inputs
- Use idempotency keys for critical operations
- Rotate tokens periodically
- Keep workspace private (consider git + private repo)
