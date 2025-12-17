import { readFileSync } from 'fs';
import * as path from 'path';
import { registerGlobalLazyLibrary } from './libraries';
import type { QuickJSContext } from 'quickjs-emscripten';

const commonLibraries = ['lodash', 'moment'] as const;

export type CommonLibrary = (typeof commonLibraries)[number];

type CommonLibraryDefinition = {
  source: string;
  globalName: string;
  librarySourceFileName: string;
};

function loadLibrarySource(packageName: string, relativePath: string): string {
  try {
    // Use require.resolve which works in most Node.js environments
    const packageJsonPath = require.resolve(`${packageName}/package.json`);
    const packageDir = path.dirname(packageJsonPath);
    return readFileSync(path.join(packageDir, relativePath), 'utf8');
  } catch (err) {
    throw new Error(`Failed to load library source for ${packageName}: ${err}`);
  }
}

// Lazy-load library sources to avoid reading files at module load time
let cachedDefinitions: Record<CommonLibrary, CommonLibraryDefinition> | null = null;

function getCommonLibraryDefinitions(): Record<CommonLibrary, CommonLibraryDefinition> {
  if (cachedDefinitions) {
    return cachedDefinitions;
  }

  cachedDefinitions = {
    lodash: {
      source: loadLibrarySource('lodash', 'lodash.min.js'),
      globalName: '_',
      librarySourceFileName: 'lodash.min.js'
    },
    moment: {
      source: loadLibrarySource('moment', 'min/moment.min.js'),
      globalName: 'moment',
      librarySourceFileName: 'min/moment.min.js'
    }
  };

  return cachedDefinitions;
}

// Any library added here must provide a single, self contained bundle that:
// 1) has no external imports/requires, and
// 2) assigns its exported value to the expected global name.
// If the package does not ship such an artifact, build one (e.g. rollup/webpack
// IIFE/UMD target that writes to the global) and point `source` at that output.
export function registerCommonLazyLibrary(ctx: QuickJSContext, library: CommonLibrary) {
  const definitions = getCommonLibraryDefinitions();
  const definition = definitions[library];

  if (!definition) {
    throw new Error(`Unknown common library "${library}". Known libraries: ${commonLibraries.join(', ')}`);
  }

  registerGlobalLazyLibrary(ctx, definition.source, definition.globalName, `"<loader:${library}>"`, definition.librarySourceFileName);
}
