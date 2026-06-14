import axios from "axios";
import dotenv from "dotenv";
import { createCliApp } from "./cli/menus.js";
import { createCliActions } from "./cli/actions.js";

dotenv.config({ path: "./.env" });

const API_URL = process.env.API_URL || "http://localhost:4444";

const api = axios.create({
  baseURL: API_URL,
});

const app = createCliApp(createCliActions(api));

app.main().catch((error) => {
  console.error("Error: " + error.message);
  process.exit(1);
});
