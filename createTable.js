import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    passwordhash TEXT NOT NULL,
    createdat TIMESTAMP DEFAULT NOW()
  );`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';`);
  console.log("users table ensured.");

  await pool.query(`CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
  );`);
  await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS userid INTEGER REFERENCES users(id) ON DELETE SET NULL;`);
  console.log("categories table ensured.");

  await pool.query(`CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    frequency TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );`);
  await pool.query(`ALTER TABLE habits ADD COLUMN IF NOT EXISTS userid INTEGER REFERENCES users(id) ON DELETE SET NULL;`);
  console.log("habits table ensured.");

  await pool.query(`CREATE TABLE IF NOT EXISTS habitcategory (
    id SERIAL PRIMARY KEY,
    habitid INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    categoryid INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE (habitid, categoryid)
  );`);
  console.log("habitcategory table ensured.");

  await pool.query(`CREATE TABLE IF NOT EXISTS habitlog (
    id SERIAL PRIMARY KEY,
    habitid INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date TIMESTAMP DEFAULT NOW()
  );`);
  console.log("habitlog table ensured.");

  await pool.query(`CREATE TABLE IF NOT EXISTS habitdaystatus (
    id SERIAL PRIMARY KEY,
    habitid INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    daydate DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'done', 'skipped', 'missed')),
    completedat TIMESTAMP NULL,
    createdat TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (habitid, daydate)
  );`);
  console.log("habitdaystatus table ensured.");

  await pool.query(`CREATE TABLE IF NOT EXISTS reminder (
    id SERIAL PRIMARY KEY,
    habitid INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    time TEXT NOT NULL
  );`);
  console.log("reminder table ensured.");

  console.log("All tables ensured.");
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error(err);
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  });
