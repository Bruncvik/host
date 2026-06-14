import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl:
    process.env.DB_SSL === "true" ||
    (process.env.DB_HOST && !["localhost", "127.0.0.1"].includes(process.env.DB_HOST))
      ? { rejectUnauthorized: false }
      : false,
};

console.log(`DB config loaded: ${dbConfig.host}:${dbConfig.port}`);

export const pool = new pg.Pool(dbConfig);
