import type { ChatThread } from "./types";

function nowMinus(minutes: number) {
  return Date.now() - minutes * 60_000;
}

export const DUMMY_THREADS: ChatThread[] = [
  {
    id: "t-1",
    title: "SSE not showing in UI",
    preview: "Let's trace the event boundaries…",
    updatedAt: nowMinus(3),
    messages: [
      {
        id: "m-1",
        role: "user",
        content: "The API says 200, but I see nothing in the UI.",
        createdAt: nowMinus(8)
      },
      {
        id: "m-2",
        role: "assistant",
        content:
          "Let's enable debug mode and verify whether events are separated by \\r\\n\\r\\n vs \\n\\n.",
        createdAt: nowMinus(7)
      }
    ]
  },
  {
    id: "t-2",
    title: "Model selection",
    preview: "Fetch /v1/models and populate dropdown",
    updatedAt: nowMinus(22),
    messages: [
      {
        id: "m-3",
        role: "user",
        content: "Can we populate the models dropdown from /v1/models?",
        createdAt: nowMinus(25)
      },
      {
        id: "m-4",
        role: "assistant",
        content: "Yep — we'll normalize a few response shapes and fall back gracefully.",
        createdAt: nowMinus(24)
      }
    ]
  }
];
