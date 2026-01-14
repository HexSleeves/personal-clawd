import { z } from "zod";

const EnvSchema = z.object({
  BAYER_CHAT_BASE_URL: z.string().url().default("https://chat.int.bayer.com/api/v2"),
  BAYER_CHAT_ACCESS_TOKEN: z.string().min(1),
  BAYER_CHAT_PROJECT: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(8787),

  LOG_LEVEL: z.enum(["silent", "error", "warn", "info", "debug"]).default("info"),
  DEBUG_HTTP: z.coerce.boolean().default(false),
  DEBUG_HTTP_BODY: z.coerce.boolean().default(false),
  DEBUG_UPSTREAM: z.coerce.boolean().default(false)
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(processEnv: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(processEnv);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${issues}`);
  }
  return parsed.data;
}
