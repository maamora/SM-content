import { spawnSync } from "node:child_process";

const nextCommand = process.platform === "win32" ? "next.cmd" : "next";
const result = spawnSync(nextCommand, ["build"], {
  stdio: "inherit",
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
