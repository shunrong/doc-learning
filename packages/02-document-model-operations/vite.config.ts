import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5174,
    open: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});
