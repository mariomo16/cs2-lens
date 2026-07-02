import esbuild from "esbuild";

const sharedConfig = {
  bundle: true,
  target: "es2022",
  outdir: "dist",
};

await Promise.all([
  esbuild.build({
    ...sharedConfig,
    entryPoints: { content: "src/content/content.ts" },
    format: "iife",
  }),
  esbuild.build({
    ...sharedConfig,
    entryPoints: { background: "src/background/background.ts" },
    format: "esm",
  }),
]);
