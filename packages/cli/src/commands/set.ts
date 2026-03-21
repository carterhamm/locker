import { requireAuth } from "../auth/config";
import { apiRequest } from "../auth/client";

export async function setCommand(service: string, key: string) {
  const config = requireAuth();

  const res = await apiRequest(
    "POST",
    "/keys",
    config,
    { service, key }
  );

  if (!res.ok) {
    console.error(res.data.error || "Failed to store key.");
    process.exit(1);
  }

  console.log(`Key stored for ${service}`);
}
