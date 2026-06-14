
import express from "express";
import { pool } from "../config/db.js";
import { validateNumericId, validateTextLength } from "../utils/validators.js";
import { ensureAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/habits", ensureAuth, async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      const result = await pool.query("SELECT * FROM habits ORDER BY id DESC");
      return res.json(result.rows);
    }
    const result = await pool.query("SELECT * FROM habits WHERE userid = $1 ORDER BY id DESC", [req.user.id]);
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
});

router.get("/habits/:id", ensureAuth, async (req, res, next) => {
  const idValidation = validateNumericId(req.params.id, "Habit ID");
  if (!idValidation.isValid) return res.status(400).json({ message: idValidation.error });

  try {
    const result = await pool.query("SELECT * FROM habits WHERE id = $1", [idValidation.parsed]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Habit not found" });
    const habit = result.rows[0];
    if (habit.userid && Number(habit.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }
    return res.json(habit);
  } catch (err) {
    return next(err);
  }
});

router.post("/habits", ensureAuth, (req, res, next) => {
  const { name, frequency, created_at } = req.body;
  if (!name || !frequency) return res.status(400).json({ message: "Name and frequency are required" });

  const nameError = validateTextLength(name, "Name", 2, 80);
  if (nameError) return res.status(400).json({ message: nameError });
  const frequencyError = validateTextLength(frequency, "Frequency", 2, 30);
  if (frequencyError) return res.status(400).json({ message: frequencyError });

  pool
    .query(
      "INSERT INTO habits (name, frequency, created_at, userid) VALUES ($1, $2, COALESCE($3, NOW()), $4) RETURNING *",
      [name.trim(), frequency.trim(), created_at || null, req.user.id]
    )
    .then((result) => res.status(201).json(result.rows[0]))
    .catch(next);
});

router.put("/habits/:id", ensureAuth, async (req, res, next) => {
  const { name, frequency } = req.body;
  const idValidation = validateNumericId(req.params.id, "Habit ID");
  if (!idValidation.isValid) return res.status(400).json({ message: idValidation.error });
  try {
    const habitResult = await pool.query("SELECT id, userid FROM habits WHERE id = $1", [idValidation.parsed]);
    if (habitResult.rows.length === 0) return res.status(404).json({ message: "Habit not found" });
    const habit = habitResult.rows[0];
    if (habit.userid && Number(habit.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    let updateQuery = "UPDATE habits SET ";
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      const nameError = validateTextLength(name, "Name", 2, 80);
      if (nameError) return res.status(400).json({ message: nameError });
      updateFields.push(`name = $${paramCount++}`);
      values.push(name.trim());
    }
    if (frequency !== undefined) {
      const frequencyError = validateTextLength(frequency, "Frequency", 2, 30);
      if (frequencyError) return res.status(400).json({ message: frequencyError });
      updateFields.push(`frequency = $${paramCount++}`);
      values.push(frequency.trim());
    }

    if (updateFields.length === 0) return res.status(400).json({ message: "No fields to update" });

    updateQuery += updateFields.join(", ") + ` WHERE id = $${paramCount} RETURNING *`;
    values.push(idValidation.parsed);

    const result = await pool.query(updateQuery, values);
    return res.json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete("/habits/:id", ensureAuth, async (req, res, next) => {
  const idValidation = validateNumericId(req.params.id, "Habit ID");
  if (!idValidation.isValid) return res.status(400).json({ message: idValidation.error });

  try {
    const habitResult = await pool.query("SELECT userid FROM habits WHERE id = $1", [idValidation.parsed]);
    if (habitResult.rows.length === 0) return res.status(404).json({ message: "Habit not found" });
    const habit = habitResult.rows[0];
    if (habit.userid && Number(habit.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const result = await pool.query("DELETE FROM habits WHERE id = $1 RETURNING *", [idValidation.parsed]);
    return res.json({ message: "Habit deleted successfully", habit: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

export default router;
