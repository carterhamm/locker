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

export async function setCommand(service: string, key: string | undefined, options: { stdin?: boolean }) {
  let apiKey = key;

  // [M6] If no key arg and not piped, prompt securely
  if (!apiKey && options.stdin) {
    apiKey = await readStdin();
  } else if (!apiKey) {
    if (process.stdin.isTTY) {
      apiKey = await prompt("API Key: ");
    } else {
      apiKey = await readStdin();
    }
  }

  if (!apiKey) {
    console.error("API key is required. Pass it as an argument, via --stdin, or interactively.");
    process.exit(1);
  }

  const config = requireAuth();

  const res = await apiRequest(
    "POST",
    "/keys",
    config,
    { service, key: apiKey }
  );

  if (!res.ok) {
    console.error(res.data.error || "Failed to store key.");
    process.exit(1);
  }

  console.log(`Key stored for ${service}`);
}
