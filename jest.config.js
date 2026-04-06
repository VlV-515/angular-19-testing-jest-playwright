module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    //Ignore e2e & functional because they are tested with Playwright, see playwright.config.ts
    '.*\\.e2e\\.spec\\.ts$',
    '.*\\.functional\\.ts$',
  ],
  globalSetup: 'jest-preset-angular/global-setup',
};
