import readline from "node:readline";
import { requireAuth } from "../auth/config";
import { apiRequest } from "../auth/client";

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { data += chunk; });
    process.stdin.on("end", () => { resolve(data.trim()); });
  });
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

export async function updateCommand(rawService: string, key: string | undefined, options: { stdin?: boolean }) {
  const service = rawService.toLowerCase().trim();
  const config = requireAuth();

  // Check if key exists first
  const checkRes = await apiRequest("GET", `/keys/${encodeURIComponent(service)}`, config);
  if (checkRes.status === 404) {
    console.error(`No key found for "${service}". Use: locker set ${service}`);
    process.exit(1);
  }

  let apiKey = key;
  if (!apiKey && options.stdin) {
    apiKey = await readStdin();
  } else if (!apiKey) {
    if (process.stdin.isTTY) {
      apiKey = await prompt("New API Key: ");
    } else {
      apiKey = await readStdin();
    }
  }

  if (!apiKey) {
    console.error("API key is required.");
    process.exit(1);
  }

  // Revoke the old key
  await apiRequest("DELETE", `/keys/${encodeURIComponent(service)}`, config);

  // Store the new one
  const res = await apiRequest("POST", "/keys", config, { service, key: apiKey });

  if (!res.ok) {
    console.error(res.data.error || "Failed to update key.");
    process.exit(1);
  }

  console.log(`Key updated for ${service}`);
}
