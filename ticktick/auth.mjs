import http from "node:http";
import { URL } from "node:url";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, chmod } from "node:fs/promises";
import { homedir } from "node:os";

const AUTH_URL = "https://ticktick.com/oauth/authorize";
const TOKEN_URL = "https://ticktick.com/oauth/token";

const clientId = process.env.TICKTICK_CLIENT_ID;
const clientSecret = process.env.TICKTICK_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error(
    "Missing env vars: TICKTICK_CLIENT_ID and/or TICKTICK_CLIENT_SECRET"
  );
  process.exit(1);
}

const scope = process.env.TICKTICK_SCOPE ?? "tasks:read tasks:write";
const redirectUri =
  process.env.TICKTICK_REDIRECT_URI ?? "http://127.0.0.1:17821/callback";

const state = randomBytes(16).toString("hex");

const auth = new URL(AUTH_URL);
auth.searchParams.set("scope", scope);
auth.searchParams.set("client_id", clientId);
auth.searchParams.set("state", state);
auth.searchParams.set("redirect_uri", redirectUri);
auth.searchParams.set("response_type", "code");

console.log("Open this URL in your browser to authorize:");
console.log(auth.toString());

const redirect = new URL(redirectUri);
const port = Number(redirect.port || 80);

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url ?? "/", redirectUri);
    if (reqUrl.pathname !== redirect.pathname) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const code = reqUrl.searchParams.get("code");
    const returnedState = reqUrl.searchParams.get("state");
    if (!code) {
      res.writeHead(400);
      res.end("Missing code");
      return;
    }
    if (returnedState !== state) {
      res.writeHead(400);
      res.end("State mismatch");
      return;
    }

    const form = new URLSearchParams();
    form.set("code", code);
    form.set("grant_type", "authorization_code");
    form.set("scope", scope);
    form.set("redirect_uri", redirectUri);

    const basic = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString(
      "base64"
    );

    const tokenResp = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: form.toString(),
    });

    const text = await tokenResp.text();
    if (!tokenResp.ok) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`Token exchange failed (${tokenResp.status})\n\n${text}`);
      return;
    }

    const tokenJson = JSON.parse(text);

    const outDir = `${homedir()}/.clawdbot/secrets`;
    const outPath = `${outDir}/ticktick.json`;

    await mkdir(outDir, { recursive: true });
    await writeFile(
      outPath,
      JSON.stringify(
        {
          obtainedAt: new Date().toISOString(),
          scope,
          redirectUri,
          token: tokenJson,
        },
        null,
        2
      )
    );

    await chmod(outPath, 0o600);

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("TickTick authorized. You can close this tab.");

    console.log(`Saved tokens to: ${outPath}`);
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(`Error: ${e?.stack || e}`);
  } finally {
    server.close();
  }
});

server.listen(port, redirect.hostname, () => {
  console.log(
    `Listening for OAuth callback on ${redirect.hostname}:${port}${redirect.pathname}`
  );
});
