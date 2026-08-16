import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const isWindows = process.platform === "win32";
const binaryName = isWindows ? "next.cmd" : "next";
const nextCommand = join(process.cwd(), "node_modules", ".bin", binaryName);

if (!existsSync(nextCommand)) {
  console.error(`Could not find the local Next.js binary at ${nextCommand}. Run pnpm install first.`);
  process.exit(1);
}

const result = spawnSync(nextCommand, ["build"], {
  stdio: "inherit",
  shell: isWindows,
  env: {
    ...process.env,
    NODE_ENV: "production",
  },
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
