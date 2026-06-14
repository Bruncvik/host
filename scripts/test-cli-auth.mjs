import axios from "axios";
import { clearApiAuthToken, setApiAuthToken } from "../cli/actions.js";

async function main() {
  console.log("Running CLI auth header test");

  const seenHeaders = [];
  const api = axios.create({
    adapter: async (config) => {
      seenHeaders.push(config.headers.Authorization || config.headers.authorization || null);
      return {
        data: { ok: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    },
  });

  setApiAuthToken(api, "test-token-123");
  await api.get("/protected");
  if (seenHeaders[0] !== "Bearer test-token-123") {
    throw new Error(`Expected bearer token header, got ${seenHeaders[0]}`);
  }

  clearApiAuthToken(api);
  await api.get("/public");
  if (seenHeaders[1] !== null) {
    throw new Error(`Expected cleared auth header, got ${seenHeaders[1]}`);
  }

  console.log("CLI auth header test passed");
}

main().catch((err) => {
  console.error("Test failed:", err.message || err);
  process.exit(1);
});
