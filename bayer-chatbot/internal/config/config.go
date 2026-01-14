package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	BayerChatBaseURL     string
	BayerChatAccessToken string
	BayerChatProject     string
	Port                 int
	LogLevel             string
	DebugHTTP            bool
	DebugHTTPBody        bool
	DebugUpstream        bool
	CORSAllowOrigin      string
	CORSAllowHeaders     string
	CORSAllowMethods     string
	CORSExposeHeaders    string
	CORSAllowCredentials bool
	CORSMaxAgeSeconds    int
}

func (c Config) Addr() string {
	return fmt.Sprintf(":%d", c.Port)
}

func FromEnv() (Config, error) {
	cfg := Config{}

	cfg.BayerChatBaseURL = getenvDefault("BAYER_CHAT_BASE_URL", "https://chat.int.bayer.com/api/v2")
	cfg.BayerChatAccessToken = os.Getenv("BAYER_CHAT_ACCESS_TOKEN")
	cfg.BayerChatProject = os.Getenv("BAYER_CHAT_PROJECT")

	cfg.Port = getenvIntDefault("PORT", 8787)
	cfg.LogLevel = strings.ToLower(getenvDefault("LOG_LEVEL", "info"))
	cfg.DebugHTTP = getenvBoolDefault("DEBUG_HTTP", false)
	cfg.DebugHTTPBody = getenvBoolDefault("DEBUG_HTTP_BODY", false)
	cfg.DebugUpstream = getenvBoolDefault("DEBUG_UPSTREAM", false)

	// Simple permissive CORS (matches current TS behavior: app.use(cors())).
	cfg.CORSAllowOrigin = getenvDefault("CORS_ALLOW_ORIGIN", "*")
	cfg.CORSAllowHeaders = getenvDefault("CORS_ALLOW_HEADERS", "content-type,x-request-id")
	cfg.CORSAllowMethods = getenvDefault("CORS_ALLOW_METHODS", "GET,POST,OPTIONS")
	cfg.CORSExposeHeaders = getenvDefault("CORS_EXPOSE_HEADERS", "x-request-id")
	cfg.CORSAllowCredentials = getenvBoolDefault("CORS_ALLOW_CREDENTIALS", false)
	cfg.CORSMaxAgeSeconds = getenvIntDefault("CORS_MAX_AGE", 600)

	if cfg.BayerChatAccessToken == "" {
		return Config{}, errors.New("Invalid environment: BAYER_CHAT_ACCESS_TOKEN: required")
	}

	return cfg, nil
}

func getenvDefault(key, def string) string {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	return v
}

func getenvIntDefault(key string, def int) int {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	i, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return i
}

func getenvBoolDefault(key string, def bool) bool {
	v := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if v == "" {
		return def
	}
	if v == "1" || v == "true" || v == "yes" || v == "y" || v == "on" {
		return true
	}
	if v == "0" || v == "false" || v == "no" || v == "n" || v == "off" {
		return false
	}
	return def
}
