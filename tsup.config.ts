import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: true,
  format: ["esm", "cjs", "iife"],
  dts: true,
  outDir: "dist",
  skipNodeModulesBundle: true,
  minify: false,
  treeshake: true,
  shims: true,
  esbuildOptions(options) {
    options.packages = "external";
  }
});
