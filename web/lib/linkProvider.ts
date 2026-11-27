export type LinkProviderKey = "gdrive" | "onedrive" | "dropbox" | "notion" | "generic";

const PROVIDER_SUFFIXES: readonly { key: Exclude<LinkProviderKey, "generic">; hosts: readonly string[] }[] = [
  { key: "gdrive", hosts: ["drive.google.com", "docs.google.com"] },
  { key: "onedrive", hosts: ["onedrive.live.com", "1drv.ms"] },
  { key: "dropbox", hosts: ["dropbox.com"] },
  { key: "notion", hosts: ["notion.so", "notion.site"] },
];

/** Map a URL hostname to a known provider key by exact host or subdomain suffix (case-insensitive). */
export function providerKey(hostname: string): LinkProviderKey {
  const normalized = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!normalized) {
    return "generic";
  }
  for (const entry of PROVIDER_SUFFIXES) {
    for (const host of entry.hosts) {
      if (normalized === host || normalized.endsWith(`.${host}`)) {
        return entry.key;
      }
    }
  }
  return "generic";
}
