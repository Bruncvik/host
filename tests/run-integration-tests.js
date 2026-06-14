#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Function to check if server is running
function isServerReady() {
  return new Promise((resolve) => {
    const req = http.get("http://localhost:4444/habits", (res) => {
      resolve(res.statusCode !== 404);
      req.abort();
    });
    req.on("error", () => resolve(false));
    setTimeout(() => {
      req.abort();
      resolve(false);
    }, 1000);
  });
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await isServerReady()) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 1000));
    process.stdout.write(".");
  }
  return false;
}

console.log("🚀 Starting test suite...\n");

// Start the server
const server = spawn("node", ["server.js"], {
  cwd: projectRoot,
  stdio: ["inherit", "pipe", "pipe"],
});

let serverOutput = "";
server.stdout.on("data", (data) => {
  serverOutput += data.toString();
  if (data.toString().includes("Server on port")) {
    console.log("✅ Server started");
  }
});

server.stderr.on("data", (data) => {
  console.error("Server error:", data.toString());
});

// Wait for server to be ready, then run tests
setTimeout(async () => {
  process.stdout.write("⏳ Waiting for server to be ready");
  const ready = await waitForServer();

  if (!ready) {
    console.error("\n❌ Server failed to start");
    server.kill();
    process.exit(1);
  }

  console.log("\n✅ Server is ready\n");

  // Run the tests
  const tests = spawn("node", ["tests/integration.test.js"], {
    cwd: projectRoot,
    stdio: "inherit",
  });

  tests.on("exit", (code) => {
    server.kill();
    process.exit(code);
  });
}, 1000);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⏹️  Shutting down...");
  server.kill();
  process.exit(1);
});
