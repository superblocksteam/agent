module.exports = {
  roots : [ '<rootDir>/' ],
  collectCoverageFrom : [ 'src/**/*.ts', '!src/gen/**' ],
  collectCoverage : true,
  coverageProvider : 'v8', // jest sometimes returns exit code 1 on coverage
                           // after codegen files
  coveragePathIgnorePatterns : [ 'local.test.ts' ],
  setupFilesAfterEnv : [ '<rootDir>/.jest/setupEnv.ts' ],
  transform : {'^.+\\.(png|ts|tsx)$' : 'ts-jest'},
  testRegex : '(/__tests__/.*|(\\.)(test|spec))\\.tsx?$',
  moduleFileExtensions : [ 'ts', 'tsx', 'js', 'jsx', 'json', 'node', 'css' ],
  moduleDirectories : [ 'node_modules', 'src' ],
  transformIgnorePatterns : [ '<rootDir>/node_modules/' ],
  moduleNameMapper : {
    '\\.(css|less)$' : '<rootDir>/test/__mocks__/styleMock.js',
    '\\.svg$' : '<rootDir>/test/__mocks__/svgMock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$' : '<rootDir>/test/__mocks__/fileMock.js'
  },
  passWithNoTests : true,
  testPathIgnorePatterns : [ 'local.test.ts', 'test/apis' ]
};
