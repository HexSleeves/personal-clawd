import { readFile } from "node:fs/promises";
import { homedir } from "node:os";

const API_BASE =
  process.env.TICKTICK_API_BASE ?? "https://api.ticktick.com/open/v1";

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const flags = {};
  const positional = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = rest[i + 1];
      if (!next || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positional.push(a);
    }
  }
  return { cmd, flags, positional };
}

async function loadToken() {
  const path = `${homedir()}/.clawdbot/secrets/ticktick.json`;
  const raw = await readFile(path, "utf8");
  const json = JSON.parse(raw);
  const accessToken = json?.token?.access_token;
  if (!accessToken) throw new Error(`No access_token found in ${path}`);
  return accessToken;
}

async function api(method, path, body) {
  const accessToken = await loadToken();
  const resp = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`${method} ${path} failed (${resp.status}): ${text}`);
  }

  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function parseTickTickDate(s) {
  // TickTick expects: yyyy-MM-dd'T'HH:mm:ssZ (e.g. 2019-11-13T03:00:00+0000)
  // This helper accepts an ISO string and converts to +0000 style.
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    throw new Error(
      `Invalid date: ${JSON.stringify(s)} (use ISO like 2026-01-13T15:00:00-06:00)`
    );
  }

  const pad = (n) => String(n).padStart(2, "0");

  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hour = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const sec = pad(d.getUTCSeconds());
  return `${year}-${month}-${day}T${hour}:${min}:${sec}+0000`;
}

const { cmd, flags } = parseArgs(process.argv.slice(2));

if (!cmd || flags.help) {
  console.log("Usage:");
  console.log("  node tt.mjs projects");
  console.log("  node tt.mjs tasks --project-id <id>");
  console.log(
    '  node tt.mjs add --project-id <id> --title "..." [--content "..."] [--due "ISO"] [--tz "America/Chicago"]'
  );
  console.log(
    "  node tt.mjs get --project-id <id> --task-id <id>  # Get task"
  );
  console.log(
    "  node tt.mjs complete --project-id <id> --task-id <id>  # Complete task"
  );
  console.log(
    "  node tt.mjs delete --project-id <id> --task-id <id>  # Delete task"
  );
  console.log(
    '  node tt.mjs update --project-id <id> --task-id <id> [--title "..."] [--content "..."] [--due "ISO"] [--tz "America/Chicago"]'
  );
  process.exit(cmd ? 0 : 1);
}

if (cmd === "projects") {
  const data = await api("GET", "/project", null);
  console.log(JSON.stringify(data, null, 2));
} else if (cmd === "tasks") {
  const projectId = flags["project-id"];
  if (!projectId) throw new Error("--project-id required");
  const data = await api(
    "GET",
    `/project/${encodeURIComponent(projectId)}/data`,
    null
  );
  console.log(JSON.stringify(data, null, 2));
} else if (cmd === "add") {
  const projectId = flags["project-id"];
  const title = flags.title;
  if (!projectId) throw new Error("--project-id required");
  if (!title) throw new Error("--title required");

  const body = {
    projectId,
    title,
  };

  if (flags.content) body.content = flags.content;
  if (flags.tz) body.timeZone = flags.tz;
  if (flags.due) body.dueDate = parseTickTickDate(flags.due);

  const data = await api("POST", "/task", body);
  console.log(JSON.stringify(data, null, 2));
} else if (cmd === "get") {
  const projectId = flags["project-id"];
  const taskId = flags["task-id"];
  if (!projectId) throw new Error("--project-id required");
  if (!taskId) throw new Error("--task-id required");

  const data = await api(
    "GET",
    `/project/${encodeURIComponent(projectId)}/task/${encodeURIComponent(taskId)}`,
    null
  );
  console.log(JSON.stringify(data, null, 2));
} else if (cmd === "complete") {
  const projectId = flags["project-id"];
  const taskId = flags["task-id"];
  if (!projectId) throw new Error("--project-id required");
  if (!taskId) throw new Error("--task-id required");

  const data = await api(
    "POST",
    `/project/${encodeURIComponent(projectId)}/task/${encodeURIComponent(taskId)}/complete`,
    null
  );
  if (data) console.log(JSON.stringify(data, null, 2));
} else if (cmd === "delete") {
  const projectId = flags["project-id"];
  const taskId = flags["task-id"];
  if (!projectId) throw new Error("--project-id required");
  if (!taskId) throw new Error("--task-id required");

  const data = await api(
    "DELETE",
    `/project/${encodeURIComponent(projectId)}/task/${encodeURIComponent(taskId)}`,
    null
  );
  if (data) console.log(JSON.stringify(data, null, 2));
} else if (cmd === "update") {
  const projectId = flags["project-id"];
  const taskId = flags["task-id"];
  if (!projectId) throw new Error("--project-id required");
  if (!taskId) throw new Error("--task-id required");

  const body = {
    id: taskId,
    projectId,
  };

  if (flags.title) body.title = flags.title;
  if (flags.content) body.content = flags.content;
  if (flags.tz) body.timeZone = flags.tz;
  if (flags.due) body.dueDate = parseTickTickDate(flags.due);

  const data = await api("POST", `/task/${encodeURIComponent(taskId)}`, body);
  console.log(JSON.stringify(data, null, 2));
} else {
  throw new Error(`Unknown command: ${cmd}`);
}
