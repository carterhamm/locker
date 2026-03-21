import { requireAuth } from "../auth/config";
import { apiRequest } from "../auth/client";

interface Service {
  service: string;
  createdAt: string;
  lastUsed: string | null;
}

export async function listCommand() {
  const config = requireAuth();

  const res = await apiRequest<{ services: Service[] }>(
    "GET",
    "/keys",
    config
  );

  if (!res.ok) {
    console.error(res.data.error || "Failed to list keys.");
    process.exit(1);
  }

  const services = res.data.services;
  if (services.length === 0) {
    console.log("No keys stored yet.");
    console.log("Store one with: locker set <service> <key>");
    return;
  }

  console.log(`${services.length} key${services.length === 1 ? "" : "s"} stored:\n`);
  for (const svc of services) {
    const lastUsed = svc.lastUsed
      ? `last used ${new Date(svc.lastUsed).toLocaleDateString()}`
      : "never used";
    console.log(`  ${svc.service}  (${lastUsed})`);
  }
}
