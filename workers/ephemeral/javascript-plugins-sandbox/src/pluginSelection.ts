/**
 * Parses a comma-separated plugin selection string into plugin IDs.
 *
 * Wildcard/removal syntax (`*`, `-plugin`) is handled on the Go side
 * (see `pkg/pluginparser`); the sandbox receives a resolved explicit list.
 *
 * @param rawSelectors - Comma-separated plugin IDs, or empty string for all.
 * @param availablePluginIds - Full set of known plugin IDs.
 * @returns Plugin IDs to load.
 */
export function parsePluginSelection(rawSelectors: string, availablePluginIds: string[]): string[] {
  const ids = rawSelectors
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (ids.length === 0) {
    return [...availablePluginIds];
  }

  const available = new Set(availablePluginIds);
  return ids.filter((id) => available.has(id));
}
