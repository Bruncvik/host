import axios from "axios";
import { createCliApp } from "./cli/menus.js";
import { createCliActions } from "./cli/actions.js";

const API_URL = "http://localhost:4444";

const api = axios.create({
  baseURL: API_URL,
});

const app = createCliApp(createCliActions(api));

app.main().catch((error) => {
  console.error("Error: " + error.message);
  process.exit(1);
});
