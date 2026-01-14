package logger

import (
	"encoding/json"
	"os"
	"strings"
	"time"
)

type Level int

const (
	LevelSilent Level = iota
	LevelError
	LevelWarn
	LevelInfo
	LevelDebug
)

type Logger struct {
	level Level
}

func New(level string) *Logger {
	lvl := parseLevel(level)
	return &Logger{level: lvl}
}

func parseLevel(level string) Level {
	s := strings.ToLower(strings.TrimSpace(level))
	switch s {
	case "silent":
		return LevelSilent
	case "error":
		return LevelError
	case "warn":
		return LevelWarn
	case "debug":
		return LevelDebug
	case "info":
		fallthrough
	default:
		return LevelInfo
	}
}

func (l *Logger) Enabled(level Level) bool {
	return l.level >= level && l.level != LevelSilent
}

func (l *Logger) Debug(msg string, fields map[string]interface{}) {
	l.log(LevelDebug, "debug", msg, fields)
}

func (l *Logger) Info(msg string, fields map[string]interface{}) {
	l.log(LevelInfo, "info", msg, fields)
}

func (l *Logger) Warn(msg string, fields map[string]interface{}) {
	l.log(LevelWarn, "warn", msg, fields)
}

func (l *Logger) Error(msg string, fields map[string]interface{}) {
	l.log(LevelError, "error", msg, fields)
}

func (l *Logger) log(level Level, levelName, msg string, fields map[string]interface{}) {
	if !l.Enabled(level) {
		return
	}

	payload := map[string]interface{}{
		"ts":    time.Now().UTC().Format(time.RFC3339Nano),
		"level": levelName,
		"msg":   msg,
	}
	for k, v := range fields {
		payload[k] = v
	}

	b, err := json.Marshal(payload)
	if err != nil {
		return
	}

	// Keep it simple: stdout for info/debug, stderr for warn/error.
	if level == LevelError || level == LevelWarn {
		_, _ = os.Stderr.Write(append(b, '\n'))
		return
	}
	_, _ = os.Stdout.Write(append(b, '\n'))
}
