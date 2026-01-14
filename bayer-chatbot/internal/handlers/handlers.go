package handlers

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"

	"bayer-chatbot-service/internal/config"
	"bayer-chatbot-service/internal/logger"
	"bayer-chatbot-service/internal/upstream"
	"bayer-chatbot-service/internal/utils"
)

type Options struct {
	Config config.Config
	Logger *logger.Logger
	Client *upstream.Client
}

type Handler struct {
	cfg    config.Config
	logr   *logger.Logger
	client *upstream.Client
}

func New(opts Options) *Handler {
	return &Handler{cfg: opts.Config, logr: opts.Logger, client: opts.Client}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	utils.WriteJSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *Handler) Models(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	rid := r.Header.Get("x-request-id")
	res, body, err := h.client.DoJSON(r.Context(), http.MethodGet, "/models", nil, nil, rid)
	if err != nil {
		msg := "upstream_error"
		if res != nil {
			msg = msg + ": " + res.Status
		}
		utils.WriteJSON(w, http.StatusBadGateway, map[string]interface{}{"error": "upstream_error", "message": msg, "requestId": rid})
		return
	}

	w.Header().Set("content-type", "application/json; charset=utf-8")
	w.WriteHeader(res.StatusCode)
	_, _ = w.Write(body)
}

// AssistantUsers matches: GET /v1/assistants/:assistantId/users
func (h *Handler) AssistantUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Expected path: /v1/assistants/{assistantId}/users
	// We keep parsing robust and return 404 for unexpected shapes.
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) != 4 || parts[0] != "v1" || parts[1] != "assistants" || parts[3] != "users" {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	assistantID := parts[2]
	if assistantID == "" {
		utils.WriteJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "invalid_request", "message": "missing assistantId"})
		return
	}

	rid := r.Header.Get("x-request-id")
	path := "/assistants/" + url.PathEscape(assistantID) + "/users"
	res, body, err := h.client.DoJSON(r.Context(), http.MethodGet, path, nil, nil, rid)
	if err != nil {
		utils.WriteJSON(w, http.StatusBadGateway, map[string]interface{}{"error": "upstream_error", "message": "upstream_error", "requestId": rid})
		return
	}

	w.Header().Set("content-type", "application/json; charset=utf-8")
	w.WriteHeader(res.StatusCode)
	_, _ = w.Write(body)
}

func (h *Handler) Chat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	input, err := readAsMap(r)
	if err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "invalid_request", "message": err.Error()})
		return
	}

	if err := validateChatInput(input); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "invalid_request", "message": err.Error()})
		return
	}

	upstreamBody := buildUpstreamChatBody(input, false)
	payload, _ := json.Marshal(upstreamBody)

	rid := r.Header.Get("x-request-id")
	res, body, err := h.client.DoJSON(r.Context(), http.MethodPost, "/chat/agent", nil, payload, rid)
	if err != nil {
		msg := "upstream_error"
		if res != nil {
			msg = msg + ": " + res.Status
		}
		utils.WriteJSON(w, http.StatusBadGateway, map[string]interface{}{"error": "upstream_error", "message": msg, "requestId": rid})
		return
	}

	w.Header().Set("content-type", "application/json; charset=utf-8")
	w.WriteHeader(res.StatusCode)
	_, _ = w.Write(body)
}

func (h *Handler) ChatStream(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	input, err := readAsMap(r)
	if err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "invalid_request", "message": err.Error()})
		return
	}

	if err := validateChatInput(input); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "invalid_request", "message": err.Error()})
		return
	}

	bufferLen := ""
	if v, ok := input["buffer_length"]; ok {
		// JSON numbers decode as float64
		if f, ok := v.(float64); ok {
			if f > 0 {
				bufferLen = strings.TrimRight(strings.TrimRight(formatFloat(f), "0"), ".")
			}
		}
	}

	upstreamBody := buildUpstreamChatBody(input, true)
	payload, _ := json.Marshal(upstreamBody)

	query := url.Values{}
	if bufferLen != "" {
		query.Set("buffer_length", bufferLen)
	}

	rid := r.Header.Get("x-request-id")
	res, err := h.client.DoSSE(r.Context(), "/chat/agent", query, payload, rid)
	if err != nil {
		utils.WriteJSON(w, http.StatusBadGateway, map[string]interface{}{"error": "upstream_error", "message": err.Error(), "requestId": rid})
		return
	}
	defer res.Body.Close()

	w.Header().Set("content-type", "text/event-stream")
	w.Header().Set("cache-control", "no-cache, no-transform")
	w.Header().Set("connection", "keep-alive")
	w.WriteHeader(http.StatusOK)

	_ = utils.CopyAndFlush(w, res.Body)
}

func readAsMap(r *http.Request) (map[string]interface{}, error) {
	var input map[string]interface{}
	if err := utils.ReadJSON(r, &input, 2<<20); err != nil {
		return nil, err
	}
	if input == nil {
		input = map[string]interface{}{}
	}
	return input, nil
}

func validateChatInput(input map[string]interface{}) error {
	if input == nil {
		return errString("missing body")
	}

	// messages must exist and have at least one element
	msgs, ok := input["messages"].([]interface{})
	if !ok || len(msgs) < 1 {
		return errString("messages must be a non-empty array")
	}

	for _, raw := range msgs {
		m, ok := raw.(map[string]interface{})
		if !ok {
			return errString("messages must be objects")
		}
		role, _ := m["role"].(string)
		content, _ := m["content"].(string)
		if role == "" || content == "" {
			return errString("each message requires role and content")
		}
	}

	_, hasAssistant := input["assistant_id"].(string)
	_, hasModel := input["model"].(string)
	if !hasAssistant && !hasModel {
		return errString("Provide either assistant_id or model")
	}

	return nil
}

func buildUpstreamChatBody(input map[string]interface{}, stream bool) map[string]interface{} {
	out := map[string]interface{}{}
	for k, v := range input {
		out[k] = v
	}
	out["stream"] = stream

	// Convert messages to include metadata: {}
	msgs := input["messages"].([]interface{})
	converted := make([]interface{}, 0, len(msgs))
	for _, raw := range msgs {
		m := raw.(map[string]interface{})
		converted = append(converted, map[string]interface{}{
			"role":     m["role"],
			"content":  m["content"],
			"metadata": map[string]interface{}{},
		})
	}
	out["messages"] = converted
	return out
}

type errString string

func (e errString) Error() string { return string(e) }

func formatFloat(f float64) string {
	b, _ := json.Marshal(f)
	return strings.Trim(string(b), "\"")
}
