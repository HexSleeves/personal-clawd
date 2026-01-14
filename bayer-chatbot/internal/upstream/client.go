package upstream

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"bayer-chatbot-service/internal/logger"
)

type Options struct {
	BaseURL       string
	AccessToken   string
	Project       string
	DebugUpstream bool
	Logger        *logger.Logger
	Timeout       time.Duration
}

type Client struct {
	baseURL     string
	accessToken string
	project     string
	debug       bool
	logr        *logger.Logger
	httpClient  *http.Client
}

func NewClient(opts Options) *Client {
	base := strings.TrimRight(opts.BaseURL, "/")
	return &Client{
		baseURL:     base,
		accessToken: opts.AccessToken,
		project:     opts.Project,
		debug:       opts.DebugUpstream,
		logr:        opts.Logger,
		httpClient:  &http.Client{Timeout: opts.Timeout},
	}
}

func (c *Client) URL(path string) (string, error) {
	if path == "" {
		return "", errors.New("empty path")
	}
	p := path
	if !strings.HasPrefix(p, "/") {
		p = "/" + p
	}
	return c.baseURL + p, nil
}

func (c *Client) DoJSON(ctx context.Context, method, path string, query url.Values, body []byte, requestID string) (*http.Response, []byte, error) {
	u, err := c.URL(path)
	if err != nil {
		return nil, nil, err
	}
	if query != nil {
		u = u + "?" + query.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, method, u, bytes.NewReader(body))
	if err != nil {
		return nil, nil, err
	}
	c.applyHeaders(req, requestID)
	req.Header.Set("accept", "application/json")
	if body != nil {
		req.Header.Set("content-type", "application/json")
	}

	c.logRequest(req)

	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, nil, err
	}
	defer res.Body.Close()

	data, _ := io.ReadAll(io.LimitReader(res.Body, 2<<20))
	c.logResponse(req, res, data)

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return res, data, errors.New("upstream error")
	}

	ct := res.Header.Get("content-type")
	if ct != "" && !strings.Contains(ct, "application/json") {
		return res, data, errors.New("unexpected content-type: " + ct)
	}

	return res, data, nil
}

func (c *Client) DoSSE(ctx context.Context, path string, query url.Values, body []byte, requestID string) (*http.Response, error) {
	u, err := c.URL(path)
	if err != nil {
		return nil, err
	}
	if query != nil {
		u = u + "?" + query.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	c.applyHeaders(req, requestID)
	req.Header.Set("accept", "text/event-stream")
	req.Header.Set("content-type", "application/json")

	c.logRequest(req)

	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(res.Body, 64*1024))
		_ = res.Body.Close()
		c.logResponse(req, res, b)
		return nil, errors.New(res.Status)
	}

	c.logResponse(req, res, nil)
	return res, nil
}

func (c *Client) applyHeaders(req *http.Request, requestID string) {
	req.Header.Set("x-baychatgpt-accesstoken", c.accessToken)
	if c.project != "" {
		req.Header.Set("mga-project", c.project)
	}
	if requestID != "" {
		req.Header.Set("x-request-id", requestID)
	}
}

func (c *Client) logRequest(req *http.Request) {
	if !c.debug || c.logr == nil {
		return
	}

	safeHeaders := map[string]interface{}{}
	for k, v := range req.Header {
		if strings.ToLower(k) == "x-baychatgpt-accesstoken" {
			safeHeaders[k] = "***"
			continue
		}
		safeHeaders[k] = strings.Join(v, ",")
	}

	c.logr.Debug("upstream.request", map[string]interface{}{
		"method":  req.Method,
		"url":     req.URL.String(),
		"headers": safeHeaders,
	})
}

func (c *Client) logResponse(req *http.Request, res *http.Response, bodyPreview []byte) {
	if !c.debug || c.logr == nil {
		return
	}

	fields := map[string]interface{}{
		"method": req.Method,
		"url":    req.URL.String(),
		"status": res.StatusCode,
	}
	if len(bodyPreview) > 0 {
		fields["bodyPreview"] = string(bodyPreview)
	}
	c.logr.Debug("upstream.response", fields)
}
