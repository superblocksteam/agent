/** @type {import('jest').Config} */
module.exports = {
  roots: ['<rootDir>/src'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts'],
  collectCoverage: true,
  coverageProvider: 'v8',
  transform: {
    '^.+\\.(ts|js)$': [
      'ts-jest',
      {
        // Skip type checking to avoid "Cannot find module" for linked sdk-api
        isolatedModules: true,
        diagnostics: false
      }
    ]
  },
  testRegex: '(\\.)(test|spec)\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // Transform @superblocksteam/sdk-api and its dependencies (ESM) so jest can import them.
  // The pattern matches the pnpm hoisted structure (.pnpm/@superblocksteam+sdk-api@...)
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/(@superblocksteam|zod)|@superblocksteam/sdk-api))'
  ],
  passWithNoTests: true,
  testTimeout: 15000
};
