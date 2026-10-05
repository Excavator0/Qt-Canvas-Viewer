import * as esbuild from "esbuild";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const canvasPath = path.resolve(process.argv[2] || "");
if (!canvasPath) {
  console.error("usage: node render-check.mjs <canvas.tsx>");
  process.exit(1);
}

const outfile = path.join(here, "dist", "render-check.cjs");
await esbuild.build({
  absWorkingDir: here,
  entryPoints: [path.join(here, "src", "render-check.jsx")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: ["node20"],
  outfile,
  jsx: "automatic",
  nodePaths: [path.join(here, "node_modules")],
  alias: {
    "cursor/canvas": path.join(here, "src", "cursor-canvas.jsx"),
    "virtual:canvas": canvasPath,
  },
  loader: { ".tsx": "tsx", ".ts": "ts" },
  logLevel: "warning",
});

const require = createRequire(import.meta.url);
delete require.cache[outfile];
require(outfile);
