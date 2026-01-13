import type { Logger } from "./logger.js";

export type BayerClientOptions = {
  baseUrl: string;
  accessToken: string;
  project?: string;
  logger?: Logger;
  debugUpstream?: boolean;
};

export class BayerChatClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly project?: string;
  private readonly logger?: Logger;
  private readonly debugUpstream: boolean;

  constructor(options: BayerClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.accessToken = options.accessToken;
    this.project = options.project;
    this.logger = options.logger;
    this.debugUpstream = options.debugUpstream ?? false;
  }

  async request<T>(
    path: string,
    init: Omit<RequestInit, "headers"> & { headers?: Record<string, string> } = {}
  ): Promise<{ status: number; headers: Headers; json: T }> {
    const url = `${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

    const headers: Record<string, string> = {
      accept: "application/json",
      "content-type": "application/json",
      "x-baychatgpt-accesstoken": this.accessToken,
      ...(this.project ? { "mga-project": this.project } : {}),
      ...(init.headers ?? {})
    };

    if (this.debugUpstream) {
      const safeHeaders = { ...headers };
      if (safeHeaders["x-baychatgpt-accesstoken"]) safeHeaders["x-baychatgpt-accesstoken"] = "***";
      this.logger?.debug("upstream.request", {
        url,
        method: init.method ?? "GET",
        headers: safeHeaders
      });
    }

    const res = await fetch(url, {
      ...init,
      headers
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (this.debugUpstream) {
        this.logger?.warn("upstream.response.error", {
          url,
          status: res.status,
          statusText: res.statusText,
          bodyPreview: text.slice(0, 2000)
        });
      }
      throw new Error(`Bayer API error ${res.status} ${res.statusText} for ${path}: ${text.slice(0, 2000)}`);
    }

    if (!contentType.includes("application/json")) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Unexpected content-type for ${path}: ${contentType || "(none)"}. Body: ${text.slice(0, 2000)}`
      );
    }

    const json = (await res.json()) as T;
    if (this.debugUpstream) {
      this.logger?.debug("upstream.response", {
        url,
        status: res.status
      });
    }

    return { status: res.status, headers: res.headers, json };
  }

  async requestSse(
    path: string,
    body: unknown,
    query: Record<string, string | number | boolean | undefined | null> = {},
    headersOverride: Record<string, string> = {}
  ): Promise<Response> {
    const url = new URL(`${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`);
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {
      accept: "text/event-stream",
      "content-type": "application/json",
      "x-baychatgpt-accesstoken": this.accessToken,
      ...(this.project ? { "mga-project": this.project } : {}),
      ...headersOverride
    };

    if (this.debugUpstream) {
      const safeHeaders = { ...headers };
      if (safeHeaders["x-baychatgpt-accesstoken"]) safeHeaders["x-baychatgpt-accesstoken"] = "***";
      this.logger?.debug("upstream.sse.request", {
        url: url.toString(),
        method: "POST",
        headers: safeHeaders
      });
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (this.debugUpstream) {
        this.logger?.warn("upstream.sse.response.error", {
          url: url.toString(),
          status: res.status,
          statusText: res.statusText,
          bodyPreview: text.slice(0, 2000)
        });
      }
      throw new Error(`Bayer API SSE error ${res.status} ${res.statusText} for ${path}: ${text.slice(0, 2000)}`);
    }

    if (this.debugUpstream) {
      this.logger?.debug("upstream.sse.response", {
        url: url.toString(),
        status: res.status
      });
    }

    return res;
  }
}
