import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "ESNext",
  sourcemap: true,
  noExternal: [],
});
