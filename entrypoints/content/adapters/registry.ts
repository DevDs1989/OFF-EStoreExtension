import { SiteAdapter } from "./types";
import { MetroAdapter } from "./metro";
import { SuperCAdapter } from "./superc";
import { LoblawsAdapter } from "./loblaws";

/** Returns the adapter for the current hostname, or null if unsupported */
export function getAdapter(): SiteAdapter | null {
  const host = window.location.hostname;
  if (host.includes("metro.ca")) return new MetroAdapter();
  if (host.includes("superc.ca")) return new SuperCAdapter();
  if (host.includes("loblaws.ca")) return new LoblawsAdapter();
  return null;
}
