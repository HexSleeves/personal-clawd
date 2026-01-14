package httpserver

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"time"

	"bayer-chatbot-service/internal/config"
	"bayer-chatbot-service/internal/logger"
)

func withCORS(cfg config.Config, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("access-control-allow-origin", cfg.CORSAllowOrigin)
		w.Header().Set("access-control-allow-headers", cfg.CORSAllowHeaders)
		w.Header().Set("access-control-allow-methods", cfg.CORSAllowMethods)
		w.Header().Set("access-control-expose-headers", cfg.CORSExposeHeaders)
		w.Header().Set("access-control-max-age", intToString(cfg.CORSMaxAgeSeconds))
		if cfg.CORSAllowCredentials {
			w.Header().Set("access-control-allow-credentials", "true")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func withRequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("x-request-id")
		if id == "" {
			id = newID()
		}
		w.Header().Set("x-request-id", id)
		r.Header.Set("x-request-id", id)
		next.ServeHTTP(w, r)
	})
}

func withHTTPLogging(cfg config.Config, logr *logger.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !cfg.DebugHTTP {
			next.ServeHTTP(w, r)
			return
		}

		start := time.Now()
		rid := r.Header.Get("x-request-id")
		var bodyPreview string
		if cfg.DebugHTTPBody && (r.Method == http.MethodPost || r.Method == http.MethodPut || r.Method == http.MethodPatch) {
			// Read and restore body for downstream handlers.
			b, _ := io.ReadAll(io.LimitReader(r.Body, 2<<20))
			_ = r.Body.Close()
			r.Body = io.NopCloser(bytes.NewReader(b))
			if len(b) > 0 {
				if len(b) > 4096 {
					bodyPreview = string(b[:4096])
				} else {
					bodyPreview = string(b)
				}
			}
		}

		fields := map[string]interface{}{
			"requestId": rid,
			"method":    r.Method,
			"path":      r.URL.Path,
		}
		if bodyPreview != "" {
			fields["bodyPreview"] = bodyPreview
		}
		logr.Info("http.request", fields)

		rw := &statusCapturingResponseWriter{ResponseWriter: w, status: 200}
		next.ServeHTTP(rw, r)

		logr.Info("http.response", map[string]interface{}{
			"requestId": rid,
			"method":    r.Method,
			"path":      r.URL.Path,
			"status":    rw.status,
			"ms":        time.Since(start).Milliseconds(),
		})
	})
}

type statusCapturingResponseWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusCapturingResponseWriter) WriteHeader(statusCode int) {
	w.status = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}

func newID() string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}

func intToString(v int) string {
	// small helper to avoid strconv import in this file
	if v == 0 {
		return "0"
	}
	neg := false
	if v < 0 {
		neg = true
		v = -v
	}
	buf := [20]byte{}
	i := len(buf)
	for v > 0 {
		i--
		buf[i] = byte('0' + v%10)
		v /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}
