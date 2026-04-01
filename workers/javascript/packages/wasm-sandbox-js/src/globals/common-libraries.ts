/**
 * Common library definitions for the QuickJS WASM sandbox.
 *
 * Libraries are pre-built, self-contained bundles loaded into the QuickJS
 * runtime via evalCode. Each library must:
 * 1. Have no external imports/requires
 * 2. Assign its exported value to the expected global name
 *
 * lodash and moment ship UMD/IIFE bundles natively.
 */
import { readFileSync } from 'fs';
import * as path from 'path';
import { registerGlobalLazyLibrary } from './libraries';
import type { QuickJSContext } from 'quickjs-emscripten-core';

const commonLibraries = ['lodash', 'moment'] as const;

export type CommonLibrary = (typeof commonLibraries)[number];

type CommonLibraryDefinition = {
  source: string;
  globalName: string;
  librarySourceFileName: string;
};

function loadLibrarySource(packageName: string, relativePath: string): string {
  try {
    const packageJsonPath = require.resolve(`${packageName}/package.json`);
    const packageDir = path.dirname(packageJsonPath);
    return readFileSync(path.join(packageDir, relativePath), 'utf8');
  } catch (err) {
    throw new Error(`Failed to load library source for ${packageName}: ${err}`);
  }
}

/** Per-library cache. Libraries are loaded individually on first use. */
const cachedDefinitions = new Map<CommonLibrary, CommonLibraryDefinition>();

function getLibraryDefinition(library: CommonLibrary): CommonLibraryDefinition {
  const cached = cachedDefinitions.get(library);
  if (cached) {
    return cached;
  }

  let definition: CommonLibraryDefinition;
  switch (library) {
    case 'lodash':
      definition = {
        source: loadLibrarySource('lodash', 'lodash.min.js'),
        globalName: '_',
        librarySourceFileName: 'lodash.min.js'
      };
      break;
    case 'moment':
      definition = {
        source: loadLibrarySource('moment', 'min/moment.min.js'),
        globalName: 'moment',
        librarySourceFileName: 'min/moment.min.js'
      };
      break;
    default:
      throw new Error(`Unknown common library "${library}". Known libraries: ${commonLibraries.join(', ')}`);
  }

  cachedDefinitions.set(library, definition);
  return definition;
}

/**
 * Registers a common library as a lazy-loaded global in the QuickJS context.
 *
 * @param ctx - The QuickJS context
 * @param library - The library to register ('lodash' or 'moment')
 */
export function registerCommonLazyLibrary(ctx: QuickJSContext, library: CommonLibrary) {
  const definition = getLibraryDefinition(library);
  registerGlobalLazyLibrary(ctx, definition.source, definition.globalName, `loader:${library}`, definition.librarySourceFileName);
}
