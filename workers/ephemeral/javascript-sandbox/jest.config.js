module.exports = {
  roots: ['<rootDir>/'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  testRegex: '(/__tests__/.*|(\\.)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'css'],
  moduleDirectories: ['node_modules', 'src'],
  transformIgnorePatterns: [],
  modulePathIgnorePatterns: ['<rootDir>/dist/__mocks__/'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.{js,jsx,ts,tsx}'],
  testEnvironment: 'node'
};
