import http from "node:http";
import { writeConfig } from "../auth/config";
import { getDefaultApiUrl } from "../auth/client";

const DASHBOARD_URL = "https://dashboard-production-fe57.up.railway.app";

function openBrowser(url: string) {
  const { exec } = require("node:child_process");
  const cmd = process.platform === "darwin" ? "open" :
              process.platform === "win32" ? "start" : "xdg-open";
  exec(`${cmd} "${url}"`);
}

export async function loginCommand(options: { register?: boolean; api?: string }) {
  const apiUrl = options.api || getDefaultApiUrl();

  console.log("🔐 Opening browser to sign in...\n");

  // Start a temporary local server to receive the callback
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", `http://localhost`);

    if (url.pathname === "/callback") {
      const token = url.searchParams.get("token");
      const email = url.searchParams.get("email");

      if (token && email) {
        writeConfig({ token, email, apiUrl });

        // Send success page that auto-closes
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Locker</title></head>
<body style="background:#000;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center">
<div style="font-size:48px;margin-bottom:16px">\u{1F510}</div>
<h2 style="font-weight:600;margin-bottom:8px">You're in!</h2>
<p style="color:rgba(255,255,255,0.5)">Logged in as ${email}. You can close this tab.</p>
</div>
</body></html>`);

        console.log(`✅ Logged in as ${email}`);
        console.log("   Token stored in ~/.locker/config\n");

        // Shut down after a brief delay
        setTimeout(() => {
          server.close();
          process.exit(0);
        }, 500);
      } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Missing token or email");
      }
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  // Listen on a random port
  server.listen(0, () => {
    const port = (server.address() as any).port;
    const authUrl = `${DASHBOARD_URL}/auth?cli=true&port=${port}${options.register ? "&register=true" : ""}`;

    console.log(`   Listening on http://localhost:${port}`);
    console.log(`   If the browser didn't open, visit:\n`);
    console.log(`   ${authUrl}\n`);

    openBrowser(authUrl);
  });

  // Timeout after 5 minutes
  setTimeout(() => {
    console.error("\n⏱️  Login timed out. Run `locker login` to try again.");
    server.close();
    process.exit(1);
  }, 5 * 60 * 1000);
}
