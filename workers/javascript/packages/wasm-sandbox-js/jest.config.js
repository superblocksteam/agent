module.exports = {
  roots: ['<rootDir>/'],
  collectCoverageFrom: ['src/**/*.ts'],
  collectCoverage: true,
  coverageProvider: 'v8',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testRegex: '(/__tests__/.*|(\\.)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  moduleDirectories: ['node_modules', 'src'],
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  passWithNoTests: true,
  testTimeout: 30000
};
