const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    testMatch: '**/*.spec.js',
    timeout: 30000,
    fullyParallel: false,
    use: {
        baseURL: 'http://localhost:3000',
        headless: true,
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'node tests/e2e/start-e2e-server.js',
        url: 'http://localhost:3000/api',
        reuseExistingServer: false,
        timeout: 20000,
    },
});