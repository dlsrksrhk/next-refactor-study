import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3100" },
  webServer: [
    {
      command: "npm run start --workspace backend",
      url: "http://127.0.0.1:4100/api/articles",
      reuseExistingServer: false,
      env: {
        PORT: "4100",
        SAVE_DELAY_MS: "0",
        SAVE_STATUS: "204",
        ARTICLE_STORE_FILE: ".data-test/articles.json",
      },
    },
    {
      command: "npm run dev --workspace frontend -- --port 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      timeout: 120_000,
      env: { BACKEND_URL: "http://127.0.0.1:4100", NEXT_DIST_DIR: ".next-test" },
    },
  ],
});
