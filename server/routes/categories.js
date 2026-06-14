import express from "express";
import { pool } from "../config/db.js";
import { ensureAuth } from "../middleware/auth.js";
import { validateCategoryName, validateNumericId } from "../utils/validators.js";

const router = express.Router();

router.get("/categories", ensureAuth, async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      const r = await pool.query("SELECT * FROM categories ORDER BY id DESC");
      return res.json(r.rows);
    }

    const r = await pool.query("SELECT * FROM categories WHERE userid = $1 ORDER BY id DESC", [req.user.id]);
    return res.json(r.rows);
  } catch (err) {
    return next(err);
  }
});

router.get("/categories/:id", ensureAuth, async (req, res, next) => {
  const idValidation = validateNumericId(req.params.id, "Category ID");
  if (!idValidation.isValid) return res.status(400).json({ message: idValidation.error });

  try {
    const r = await pool.query("SELECT * FROM categories WHERE id = $1", [idValidation.parsed]);
    if (r.rows.length === 0) return res.status(404).json({ message: "Category not found" });
    const category = r.rows[0];
    if (category.userid && Number(category.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }
    return res.json(category);
  } catch (err) {
    return next(err);
  }
});

router.post("/categories", ensureAuth, async (req, res, next) => {
  const { name } = req.body;
  
  const validation = validateCategoryName(name);
  if (!validation.isValid) {
    return res.status(400).json({ message: validation.error });
  }

  try {
    const r = await pool.query("INSERT INTO categories (name, userid) VALUES ($1, $2) RETURNING *", [
      validation.sanitized,
      req.user.id,
    ]);
    return res.status(201).json(r.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.put("/categories/:id", ensureAuth, async (req, res, next) => {
  const { name } = req.body;
  if (name === undefined) return res.status(400).json({ message: "No fields to update" });
  const idValidation = validateNumericId(req.params.id, "Category ID");
  if (!idValidation.isValid) return res.status(400).json({ message: idValidation.error });

  const validation = validateCategoryName(name);
  if (!validation.isValid) {
    return res.status(400).json({ message: validation.error });
  }

  try {
    const categoryResult = await pool.query("SELECT userid FROM categories WHERE id = $1", [idValidation.parsed]);
    if (categoryResult.rows.length === 0) return res.status(404).json({ message: "Category not found" });
    const category = categoryResult.rows[0];
    if (category.userid && Number(category.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const r = await pool.query("UPDATE categories SET name = $1 WHERE id = $2 RETURNING *", [
      validation.sanitized,
      idValidation.parsed,
    ]);
    return res.json(r.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete("/categories/:id", ensureAuth, async (req, res, next) => {
  const idValidation = validateNumericId(req.params.id, "Category ID");
  if (!idValidation.isValid) return res.status(400).json({ message: idValidation.error });

  try {
    const categoryResult = await pool.query("SELECT userid FROM categories WHERE id = $1", [idValidation.parsed]);
    if (categoryResult.rows.length === 0) return res.status(404).json({ message: "Category not found" });
    const category = categoryResult.rows[0];
    if (category.userid && Number(category.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const r = await pool.query("DELETE FROM categories WHERE id = $1 RETURNING *", [idValidation.parsed]);
    return res.json({ message: "Category deleted", category: r.rows[0] });
  } catch (err) {
    return next(err);
  }
});

export default router;
