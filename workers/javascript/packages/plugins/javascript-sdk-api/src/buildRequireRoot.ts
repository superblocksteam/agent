/**
 * Builds requireRoot paths so the VM2 sandbox can resolve @superblocksteam/sdk-api.
 * The bundle keeps sdk-api as external (esbuild), so the sandbox must resolve it.
 * Works in local (pnpm), CI (pnpm install), and Docker (node_modules at WORKDIR).
 *
 * The bootstrap's customResolver uses these paths with require.resolve(moduleName, { paths })
 * when VM2's normal lookup fails (e.g. pnpm's .pnpm layout).
 */
export function buildRequireRoot(): string[] {
  const path = require('path');
  const requireRoot: string[] = [process.cwd()];
  try {
    const sdkApiPkg = require.resolve('@superblocksteam/sdk-api/package.json');
    // sdkApiPkg = .../node_modules/@superblocksteam/sdk-api/package.json (or pnpm equiv)
    // Ascend to the directory containing node_modules
    const projectRoot = path.dirname(path.dirname(path.dirname(path.dirname(sdkApiPkg))));
    requireRoot.push(projectRoot);
  } catch {
    // sdk-api not resolvable from this process; rely on other roots
  }
  if (process.argv[1]) {
    requireRoot.push(path.resolve(path.dirname(process.argv[1]), '..'));
  }
  return requireRoot;
}
