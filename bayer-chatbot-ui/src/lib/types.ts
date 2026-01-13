export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type ChatThread = {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
  messages: ChatMessage[];
};
