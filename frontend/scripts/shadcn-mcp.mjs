/* STUDIO MCP LAUNCHER: starts the official shadcn MCP from the frontend directory so components.json and the React Bits registry are discovered in this monorepo. */
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendDirectory = resolve(scriptDirectory, "..");
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(npx, ["--yes", "shadcn@latest", "mcp"], {
  cwd: frontendDirectory,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("Unable to start the shadcn MCP server:", error.message);
  process.exitCode = 1;
});

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
