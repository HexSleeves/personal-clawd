package httpserver

import (
	"net/http"

	"bayer-chatbot-service/internal/config"
	"bayer-chatbot-service/internal/handlers"
	"bayer-chatbot-service/internal/logger"
	"bayer-chatbot-service/internal/upstream"
)

type Options struct {
	Config config.Config
	Logger *logger.Logger
	Client *upstream.Client
}

func New(opts Options) http.Handler {
	mux := http.NewServeMux()

	h := handlers.New(handlers.Options{
		Config: opts.Config,
		Logger: opts.Logger,
		Client: opts.Client,
	})

	mux.HandleFunc("/health", h.Health)
	mux.HandleFunc("/v1/models", h.Models)
	mux.HandleFunc("/v1/assistants/", h.AssistantUsers) // /v1/assistants/:assistantId/users
	mux.HandleFunc("/v1/chat", h.Chat)
	mux.HandleFunc("/v1/chat/stream", h.ChatStream)

	var handler http.Handler = mux
	handler = withCORS(opts.Config, handler)
	handler = withRequestID(handler)
	handler = withHTTPLogging(opts.Config, opts.Logger, handler)

	return handler
}
