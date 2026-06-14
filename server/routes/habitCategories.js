import express from "express";
import { pool } from "../config/db.js";
import { ensureAuth } from "../middleware/auth.js";
import { validateNumericId } from "../utils/validators.js";

const router = express.Router();

router.get("/habits/:id/categories", ensureAuth, async (req, res, next) => {
  const habitIdValidation = validateNumericId(req.params.id, "Habit ID");
  if (!habitIdValidation.isValid) return res.status(400).json({ message: habitIdValidation.error });

  try {
    const habitResult = await pool.query("SELECT userid FROM habits WHERE id = $1", [habitIdValidation.parsed]);
    if (habitResult.rows.length === 0) return res.status(404).json({ message: "Habit not found" });
    const habit = habitResult.rows[0];
    if (habit.userid && Number(habit.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const r = await pool.query(
      `SELECT c.*
       FROM categories c
       JOIN habitcategory hc ON c.id = hc.categoryid
       WHERE hc.habitid = $1
         AND (c.userid = $2 OR $3 = 'admin')`,
      [habitIdValidation.parsed, req.user.id, req.user.role]
    );
    return res.json(r.rows);
  } catch (err) {
    return next(err);
  }
});

router.post("/habits/:id/categories", ensureAuth, async (req, res, next) => {
  const { categoryId } = req.body;
  if (!categoryId) return res.status(400).json({ message: "categoryId required" });
  const habitIdValidation = validateNumericId(req.params.id, "Habit ID");
  if (!habitIdValidation.isValid) return res.status(400).json({ message: habitIdValidation.error });
  const categoryIdValidation = validateNumericId(categoryId, "Category ID");
  if (!categoryIdValidation.isValid) return res.status(400).json({ message: categoryIdValidation.error });
  try {
    const habitResult = await pool.query("SELECT userid FROM habits WHERE id = $1", [habitIdValidation.parsed]);
    if (habitResult.rows.length === 0) return res.status(404).json({ message: "Habit not found" });
    const habit = habitResult.rows[0];
    if (habit.userid && Number(habit.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const categoryResult = await pool.query("SELECT userid FROM categories WHERE id = $1", [categoryIdValidation.parsed]);
    if (categoryResult.rows.length === 0) return res.status(404).json({ message: "Category not found" });
    const category = categoryResult.rows[0];
    if (category.userid && Number(category.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const r = await pool.query(
      "INSERT INTO habitcategory (habitid, categoryid) VALUES ($1, $2) RETURNING *",
      [habitIdValidation.parsed, categoryIdValidation.parsed]
    );
    return res.status(201).json(r.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete("/habits/:id/categories/:categoryId", ensureAuth, async (req, res, next) => {
  const habitIdValidation = validateNumericId(req.params.id, "Habit ID");
  if (!habitIdValidation.isValid) return res.status(400).json({ message: habitIdValidation.error });
  const categoryIdValidation = validateNumericId(req.params.categoryId, "Category ID");
  if (!categoryIdValidation.isValid) return res.status(400).json({ message: categoryIdValidation.error });

  try {
    const habitResult = await pool.query("SELECT userid FROM habits WHERE id = $1", [habitIdValidation.parsed]);
    if (habitResult.rows.length === 0) return res.status(404).json({ message: "Habit not found" });
    const habit = habitResult.rows[0];
    if (habit.userid && Number(habit.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const categoryResult = await pool.query("SELECT userid FROM categories WHERE id = $1", [categoryIdValidation.parsed]);
    if (categoryResult.rows.length === 0) return res.status(404).json({ message: "Category not found" });
    const category = categoryResult.rows[0];
    if (category.userid && Number(category.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const r = await pool.query("DELETE FROM habitcategory WHERE habitid = $1 AND categoryid = $2 RETURNING *", [habitIdValidation.parsed, categoryIdValidation.parsed]);
    if (r.rows.length === 0) return res.status(404).json({ message: "Mapping not found" });
    return res.json({ message: "Mapping deleted", mapping: r.rows[0] });
  } catch (err) {
    return next(err);
  }
});

export default router;
