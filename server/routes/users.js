import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { validateEmail, validateNumericId, validatePassword, looksLikeBcryptHash } from "../utils/validators.js";
import { BCRYPT, ROLES, JWT } from "../constants.js";

const router = express.Router();

const ALLOWED_ROLES = ROLES.ALLOWED;
const JWT_SECRET = process.env.JWT_SECRET || JWT.SECRET_DEFAULT;

router.get("/users", (req, res, next) => {
  pool
    .query("SELECT id, email, createdat, role FROM users ORDER BY id DESC")
    .then((r) => res.json(r.rows))
    .catch(next);
});

router.get("/users/:id", (req, res, next) => {
  const idValidation = validateNumericId(req.params.id, "User ID");
  if (!idValidation.isValid) return res.status(400).json({ message: idValidation.error });

  pool
    .query("SELECT id, email, createdat, role FROM users WHERE id = $1", [idValidation.parsed])
    .then((r) => {
      if (r.rows.length === 0) return res.status(404).json({ message: "User not found" });
      res.json(r.rows[0]);
    })
    .catch(next);
});

router.post("/users", async (req, res, next) => {
  const { email, password, createdAt, role } = req.body;

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return res.status(400).json({ message: emailValidation.error });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ message: passwordValidation.error });
  }

  const normalizedRole = (role || "user").toLowerCase();
  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT.SALT_ROUNDS);
    const r = await pool.query(
      "INSERT INTO users (email, passwordhash, createdat, role) VALUES ($1, $2, COALESCE($3, NOW()), $4) RETURNING *",
      [emailValidation.sanitized, passwordHash, createdAt || null, normalizedRole]
    );
    return res.status(201).json(r.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post("/auth/login", async (req, res, next) => {
  const { email, password } = req.body;

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return res.status(400).json({ message: emailValidation.error });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  try {
    const r = await pool.query(
      "SELECT id, email, role, passwordhash FROM users WHERE email = $1",
      [emailValidation.sanitized]
    );

    if (r.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = r.rows[0];
    const matchesHash = looksLikeBcryptHash(user.passwordhash)
      ? await bcrypt.compare(password, user.passwordhash)
      : false;

    if (!matchesHash) {
      // Backward compatibility for existing plaintext passwords: auto-upgrade on successful login.
      if (user.passwordhash !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const upgradedHash = await bcrypt.hash(password, BCRYPT.SALT_ROUNDS);
      await pool.query("UPDATE users SET passwordhash = $1 WHERE id = $2", [upgradedHash, user.id]);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: JWT.EXPIRY,
    });

    return res.json({ id: user.id, email: user.email, role: user.role, token });
  } catch (error) {
    return next(error);
  }
});

router.put("/users/:id", async (req, res, next) => {
  const { email, password, role } = req.body;
  const idValidation = validateNumericId(req.params.id, "User ID");
  if (!idValidation.isValid) return res.status(400).json({ message: idValidation.error });

  let q = "UPDATE users SET ";
  const fields = [];
  const vals = [];
  let i = 1;

  if (email !== undefined) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.error });
    }
    fields.push(`email = $${i++}`);
    vals.push(emailValidation.sanitized);
  }

  try {
    if (password !== undefined) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ message: passwordValidation.error });
      }
      const passwordHash = await bcrypt.hash(password, BCRYPT.SALT_ROUNDS);
      fields.push(`passwordhash = $${i++}`);
      vals.push(passwordHash);
    }

    if (role !== undefined) {
      const normalizedRole = String(role).toLowerCase();
      if (!ALLOWED_ROLES.includes(normalizedRole)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      fields.push(`role = $${i++}`);
      vals.push(normalizedRole);
    }

    if (fields.length === 0) return res.status(400).json({ message: "No fields to update" });

    q += fields.join(", ") + ` WHERE id = $${i} RETURNING *`;
    vals.push(idValidation.parsed);
    const r = await pool.query(q, vals);
    if (r.rows.length === 0) return res.status(404).json({ message: "User not found" });
    return res.json(r.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.delete("/users/:id", (req, res, next) => {
  const idValidation = validateNumericId(req.params.id, "User ID");
  if (!idValidation.isValid) return res.status(400).json({ message: idValidation.error });

  pool
    .query("DELETE FROM users WHERE id = $1 RETURNING *", [idValidation.parsed])
    .then((r) => {
      if (r.rows.length === 0) return res.status(404).json({ message: "User not found" });
      res.json({ message: "User deleted", user: r.rows[0] });
    })
    .catch(next);
});

export default router;
