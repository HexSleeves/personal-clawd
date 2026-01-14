import { ApiRequestError, type ModelsResponse, type OpenAIModel } from "./types";

/**
 * Normalize base URL by removing trailing slashes
 */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Handle fetch response errors consistently
 */
async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new ApiRequestError({
      status: res.status,
      statusText: res.statusText,
      message: text ? `${res.status} ${res.statusText}: ${text.slice(0, 500)}` : `${res.status} ${res.statusText}`
    });
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    const preview = text.slice(0, 500);
    const hint = contentType ? ` (content-type: ${contentType})` : "";
    throw new Error(`Invalid JSON response${hint}: ${preview || "<empty>"}`);
  }
}

/**
 * Extract model ID from various formats
 */
function extractModelId(item: unknown): string | null {
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null && "id" in item) {
    const model = item as OpenAIModel;
    return typeof model.id === "string" ? model.id : null;
  }
  return null;
}

/**
 * Normalize models response to string array
 * Supports: OpenAI-style, simple array, alternative { models: [...] } shape
 */
function normalizeModelsResponse(json: ModelsResponse): string[] {
  // Simple array: ["gpt-...", ...]
  if (Array.isArray(json)) {
    return json.map(extractModelId).filter((id): id is string => id !== null);
  }

  // OpenAI-style: { data: [{ id: "gpt-..." }, ...] }
  if ("data" in json && Array.isArray(json.data)) {
    return json.data.map(extractModelId).filter((id): id is string => id !== null);
  }

  // Alternative: { models: ["...", ...] }
  if ("models" in json && Array.isArray(json.models)) {
    return json.models.filter((m): m is string => typeof m === "string");
  }

  return [];
}

/**
 * Fetch available models from the API
 */
export async function listModels(apiBase: string): Promise<string[]> {
  const url = `${normalizeBaseUrl(apiBase)}/v1/models`;
  const res = await fetch(url, {
    headers: {
      accept: "application/json"
    }
  });
  const json = await handleResponse<ModelsResponse>(res);
  return normalizeModelsResponse(json);
}
