import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  sourcemap: true,
  clean: true,
  bundle: true,
  target: "es2020",
  format: ["esm", "iife"],
  dts: true,
  outDir: "dist",
  minify: true,
  esbuildOptions(options) {
    options.packages = "external";
  }
});
