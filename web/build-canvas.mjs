import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const canvasPath = process.argv[2] ? path.resolve(process.argv[2]) : "";
const outfile = path.resolve(process.argv[3] || path.join(here, "dist", "bundle.js"));

if (!canvasPath || !fs.existsSync(canvasPath)) {
  console.error("Canvas file not found: " + canvasPath);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outfile), { recursive: true });

await esbuild.build({
  absWorkingDir: here,
  entryPoints: [path.join(here, "src", "entry.jsx")],
  bundle: true,
  format: "iife",
  target: ["chrome80"],
  outfile,
  jsx: "automatic",
  legalComments: "none",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  nodePaths: [path.join(here, "node_modules")],
  alias: {
    "cursor/canvas": path.join(here, "src", "cursor-canvas.jsx"),
    "virtual:canvas": canvasPath,
  },
  loader: {
    ".tsx": "tsx",
    ".ts": "ts",
  },
  logLevel: "info",
});

const dist = path.dirname(outfile);
const host = fs
  .readFileSync(path.join(here, "host.html"), "utf8")
  .replace('src="bundle.js"', 'src="' + path.basename(outfile) + "?v=" + Date.now() + '"');
fs.writeFileSync(path.join(dist, "host.html"), host);
fs.copyFileSync(path.join(here, "qwebchannel.js"), path.join(dist, "qwebchannel.js"));
