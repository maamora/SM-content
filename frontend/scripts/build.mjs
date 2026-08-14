import { spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const nextCommand = isWindows ? "next.cmd" : "next";
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
