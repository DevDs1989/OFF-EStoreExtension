import { SiteAdapter } from "./types";
import { MetroAdapter } from "./metro";
import { SuperCAdapter } from "./superc";

const ADAPTERS: SiteAdapter[] = [new MetroAdapter(), new SuperCAdapter()];

/** Returns the adapter for the current hostname, or null if unsupported */
export function getAdapter(): SiteAdapter | null {
  const host = window.location.hostname;
  if (host.includes("metro.ca")) return ADAPTERS[0];
  if (host.includes("superc.ca")) return ADAPTERS[1];
  return null;
}
