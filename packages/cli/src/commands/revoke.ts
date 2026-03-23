import { requireAuth } from "../auth/config";
import { apiRequest } from "../auth/client";

export async function revokeCommand(rawService: string) {
  const service = rawService.toLowerCase().trim();
  const config = requireAuth();

  const res = await apiRequest(
    "DELETE",
    `/keys/${encodeURIComponent(service)}`,
    config
  );

  if (!res.ok) {
    if (res.status === 404) {
      console.error(`No key found for service: ${service}`);
      process.exit(1);
    }
    console.error(res.data.error || "Failed to revoke key.");
    process.exit(1);
  }

  console.log(`🗑️  Revoked: ${service}`);
}
