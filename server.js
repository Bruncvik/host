import dotenv from "dotenv";
import { app } from "./server/app.js";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 4444;

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

const server = app.listen(PORT, "0.0.0.0", () => {
  const address = server.address();
  const boundPort = typeof address === "object" && address ? address.port : PORT;
  console.log(`Server on port ${boundPort}`);
});

server.on("error", (error) => {
  console.error("Server listen error:", error);
});
