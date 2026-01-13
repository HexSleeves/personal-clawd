export async function listModels(apiBase: string): Promise<string[]> {
  const url = `${apiBase.replace(/\/+$/, "")}/v1/models`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }

  const json = (await res.json()) as any;

  // Support a few common shapes:
  // - OpenAI-style: { data: [{ id: "gpt-..." }, ...] }
  // - Simple: ["gpt-...", ...]
  // - Alt: { models: ["...", ...] }
  const models: string[] = Array.isArray(json)
    ? json.filter((m: unknown) => typeof m === "string")
    : Array.isArray(json?.data)
      ? json.data
          .map((m: any) => (typeof m === "string" ? m : m?.id))
          .filter((m: unknown) => typeof m === "string")
      : Array.isArray(json?.models)
        ? json.models.filter((m: unknown) => typeof m === "string")
        : [];

  return models;
}
