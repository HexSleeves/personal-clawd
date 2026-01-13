# CAPABILITIES.md - What Miso Can Do

## Core Functions

### Multi-Platform Messaging

- **WhatsApp**: Via Baileys connection (single session per host)
- **Telegram**: Bot integration with polling and webhook support
- **Slack**: Workspace integration and bot commands
- **Discord**: Server and DM support
- **Signal**: Encrypted messaging
- **iMessage**: macOS native integration
- **WebChat**: Browser-based interface

### AI Agent Operations

- **Prompt Execution**: Run AI agents with context and memory
- **Multi-Model Support**: OpenAI Codex (gpt-5.2 configured)
- **Context Retention**: 10-session rolling window
- **Memory Integration**: Daily logs with 30-day retention
- **Concurrent Execution**: Up to 3 agents simultaneously
- **Retry Logic**: Automatic retry with exponential backoff (3 attempts)
- **Timeout Management**: 5-minute execution limit per agent

### Real-Time Communication

- **WebSocket Control Plane**: Low-latency command/response
- **Event Streaming**: Real-time updates and notifications
- **Presence Tracking**: User and system availability status
- **Health Monitoring**: 60-second interval checks
- **Compression**: Enabled for efficient data transfer
- **Batching**: 100ms delay for event aggregation

### Node Integration (Bridge Protocol)

- **Canvas Operations**: Interactive HTML and A2UI rendering
- **Camera Access**: Photo and video capture on paired devices
- **Screen Recording**: Capture device screens
- **Location Services**: Get device location data
- **Cross-Platform**: macOS, iOS, Android support

### Automation & Scheduling

- **Cron Jobs**: Scheduled task execution
- **Heartbeat Monitoring**: System health checks
- **Event-Driven**: React to presence, chat, and system events
- **Idempotent Operations**: Safe retry for critical actions

## Performance Features

### Speed Optimizations

- **Connection Pooling**: Max 100 concurrent WebSocket connections
- **Event Queue**: Batched processing (1000 max, 10 batch size)
- **Caching**: 1-hour TTL, 100-item capacity
- **WebSocket Compression**: Reduced bandwidth usage
- **Keep-Alive**: 25-second intervals for persistent connections

### Reliability

- **Exponential Backoff**: Intelligent retry delays
- **Graceful Degradation**: Continue operation despite partial failures
- **Health Checks**: Continuous monitoring with alerts
- **Error Logging**: Structured logs for debugging
- **Session Recovery**: Reconnection handling

### Concurrency

- **Agent Limit**: 3 concurrent executions
- **Telegram Updates**: 5 concurrent update processing
- **Message Batching**: Group related messages
- **Non-Blocking I/O**: Asynchronous event handling

## Security Features

### Authentication

- **Token-Based Auth**: Secure gateway access
- **Profile Management**: Multiple provider profiles
- **Session Validation**: Handshake verification
- **Scope Control**: Message acknowledgment scoping

### Privacy & Safety

- **No Streaming to External**: Prevent partial message leaks
- **Secret Protection**: Don't exfiltrate credentials
- **Input Validation**: Schema-based frame validation
- **Idempotency Keys**: Prevent duplicate operations
- **Allowlist Control**: Telegram DM policy

## Integration Capabilities

### External Tools

- **iMessage/SMS**: Send messages via macOS
- **Text-to-Speech**: Audio output to speakers/rooms
- **Custom Commands**: Extensible tool integration

### Development Tools

- **Node.js**: npm skill installation
- **Git**: Version control for workspace
- **SSH Tunneling**: Remote access (port 18789)
- **Tailscale**: VPN alternative (currently disabled)

### APIs & Protocols

- **WebSocket**: JSON-based control plane
- **TCP JSONL**: Bridge protocol for nodes
- **REST**: Canvas host on port 18793
- **TypeBox Schemas**: Protocol typing and validation
- **JSON Schema**: Code generation support

## Limitations

### Single-Instance Constraints

- One Gateway per host
- One Baileys session per host
- No event replay (clients must refresh on gaps)

### Message Constraints

- Max payload: 10MB per WebSocket frame
- No streaming to external messaging surfaces
- Batch delay may introduce minimal latency

### Memory Constraints

- 30-day retention (configurable)
- 10-session context window
- Cache limited to 100 items
- Event queue max 1000 items

## Best Use Cases

### Ideal For

- Personal AI assistant across multiple platforms
- Automated notifications and alerts
- Multi-device coordination (via bridge)
- Scheduled tasks and monitoring
- Context-aware conversations with memory
- Interactive canvas applications

### Not Ideal For

- High-frequency trading (latency-sensitive)
- Real-time streaming media
- Large file transfers (>10MB)
- Public bot services (single-user optimized)
- Stateless request/response (memory overhead)

## Future Enhancements

### Potential Additions

- Tailscale remote access enablement
- Additional model provider support
- Canvas template library
- Advanced cron scheduling
- Metric dashboards
- Multi-gateway coordination
