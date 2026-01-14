/**
 * API Response Types
 * Supports multiple common API response shapes for models endpoint
 */

// OpenAI-style model object
export interface OpenAIModel {
  id: string;
  object?: "model";
  created?: number;
  owned_by?: string;
}

// Possible response shapes from /v1/models
export type ModelsResponse =
  | string[] // Simple array of model names
  | { data: (OpenAIModel | string)[] } // OpenAI-style
  | { models: string[] }; // Alternative shape

// Normalized API error
export interface ApiError {
  status: number;
  statusText: string;
  message: string;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly statusText: string;

  constructor({ status, statusText, message }: ApiError) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.statusText = statusText;
  }
}
