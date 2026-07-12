import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

if (process.env.DATABASE_URL) {
  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
  run("npx prisma migrate deploy");
} else {
  console.warn("DATABASE_URL not set — skipping prisma migrate deploy");
}

run("npx next build");
