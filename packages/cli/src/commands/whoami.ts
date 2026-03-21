import { requireAuth } from "../auth/config";

export function whoamiCommand() {
  const config = requireAuth();
  console.log(config.email);
}
