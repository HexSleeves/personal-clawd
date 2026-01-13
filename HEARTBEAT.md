# HEARTBEAT.md

## Heartbeat Checklist (Keep Small)

### System Health

- [ ] Gateway connection status (WebSocket)
- [ ] Provider authentication (OpenAI Codex)
- [ ] Telegram bot polling status
- [ ] Memory log accessibility

### Performance Metrics

- [ ] Active WebSocket connections < 100
- [ ] Event queue size < 500
- [ ] Agent execution response time < 30s
- [ ] Cache hit rate > 50%

### Operational Status

- [ ] Disk space available for logs
- [ ] Memory directory writable
- [ ] No critical errors in last 24h
- [ ] Scheduled cron jobs executing

### Quick Actions

- Rotate logs if > 100MB
- Archive memory logs > 30 days
- Clear cache if hit rate < 30%
- Alert on repeated agent failures
