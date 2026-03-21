import readline from "node:readline";
import { writeConfig } from "../auth/config";
import { authRequest, getDefaultApiUrl } from "../auth/client";

function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (hidden && process.stdin.isTTY) {
      // Hide password input
      process.stdout.write(question);
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding("utf8");

      let input = "";
      const onData = (ch: string) => {
        if (ch === "\n" || ch === "\r" || ch === "\u0004") {
          stdin.setRawMode(false);
          stdin.removeListener("data", onData);
          stdin.pause();
          rl.close();
          process.stdout.write("\n");
          resolve(input);
        } else if (ch === "\u0003") {
          // Ctrl-C
          process.exit(0);
        } else if (ch === "\u007F" || ch === "\b") {
          // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
          }
        } else {
          input += ch;
        }
      };
      stdin.on("data", onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

export async function loginCommand(options: { register?: boolean; api?: string }) {
  const apiUrl = options.api || getDefaultApiUrl();
  const isRegister = options.register || false;

  console.log(isRegister ? "Create a new Locker account" : "Log in to Locker");
  console.log();

  const email = await prompt("Email: ");
  const password = await prompt("Password: ", true);

  if (!email || !password) {
    console.error("Email and password are required.");
    process.exit(1);
  }

  if (isRegister && password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const endpoint = isRegister ? "/auth/register" : "/auth/login";
  const res = await authRequest<{ token: string; user: { id: string; email: string } }>(
    "POST",
    endpoint,
    apiUrl,
    { email, password }
  );

  if (!res.ok) {
    console.error(res.data.error || "Authentication failed.");
    process.exit(1);
  }

  writeConfig({
    token: res.data.token,
    email: res.data.user.email,
    apiUrl,
  });

  console.log();
  console.log(`Logged in as ${res.data.user.email}`);
  console.log("Token stored in ~/.locker/config");
}
