import { useEffect, useState } from "react";

import { listModels } from "../lib/api";

interface UseModelsResult {
  models: string[] | null;
  error: string;
  isLoading: boolean;
}

/**
 * Hook to fetch and manage available models from the API
 */
export function useModels(apiBase: string): UseModelsResult {
  const [models, setModels] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchModels() {
      try {
        setIsLoading(true);
        setError("");
        const data = await listModels(apiBase);
        if (cancelled) return;
        setModels(data.length ? data : null);
      } catch (err) {
        if (cancelled) return;
        setModels(null);
        const message = err instanceof Error ? err.message : String(err);
        setError(`Failed to load models from ${apiBase}/v1/models: ${message}`);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void fetchModels();

    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  return { models, error, isLoading };
}
