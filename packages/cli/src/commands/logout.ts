import { clearConfig, readConfig } from "../auth/config";

export function logoutCommand() {
  const config = readConfig();
  clearConfig();

  if (config) {
    console.log(`Logged out (${config.email}). Token cleared.`);
  } else {
    console.log("Already logged out.");
  }
}
