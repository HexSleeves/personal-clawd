/**
 * SSE Client Types
 */

export type SseChunkHandler = (rawEvent: string, data: string) => void;

export interface SseParseOptions {
  onEvent: SseChunkHandler;
  signal?: AbortSignal;
  debug?: boolean;
  onOpen?: (res: Response) => void;
}

/**
 * OpenAI-style streaming response chunk
 */
export interface OpenAIChatChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index?: number;
    delta?: {
      role?: string;
      content?: string;
    };
    message?: {
      role?: string;
      content?: string;
    };
    finish_reason?: string | null;
  }>;
}

/**
 * Alternative streaming chunk formats
 */
export interface AlternativeChunk {
  delta?: string;
  text?: string;
}

export type StreamingChunk = OpenAIChatChunk | AlternativeChunk;
