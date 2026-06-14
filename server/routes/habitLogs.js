import express from "express";
import { pool } from "../config/db.js";
import { ensureAuth } from "../middleware/auth.js";
import { validateNumericId } from "../utils/validators.js";

const router = express.Router();

router.get("/habits/:id/logs", ensureAuth, async (req, res, next) => {
  const habitIdValidation = validateNumericId(req.params.id, "Habit ID");
  if (!habitIdValidation.isValid) return res.status(400).json({ message: habitIdValidation.error });

  try {
    const habitResult = await pool.query("SELECT userid FROM habits WHERE id = $1", [habitIdValidation.parsed]);
    if (habitResult.rows.length === 0) return res.status(404).json({ message: "Habit not found" });
    const habit = habitResult.rows[0];
    if (habit.userid && Number(habit.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const r = await pool.query("SELECT * FROM habitlog WHERE habitid = $1 ORDER BY date DESC", [habitIdValidation.parsed]);
    return res.json(r.rows);
  } catch (err) {
    return next(err);
  }
});

router.post("/habits/:id/logs", ensureAuth, async (req, res, next) => {
  const { date } = req.body;
  const habitIdValidation = validateNumericId(req.params.id, "Habit ID");
  if (!habitIdValidation.isValid) return res.status(400).json({ message: habitIdValidation.error });
  try {
    const habitResult = await pool.query("SELECT userid FROM habits WHERE id = $1", [habitIdValidation.parsed]);
    if (habitResult.rows.length === 0) return res.status(404).json({ message: "Habit not found" });
    const habit = habitResult.rows[0];
    if (habit.userid && Number(habit.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const r = await pool.query("INSERT INTO habitlog (habitid, date) VALUES ($1, COALESCE($2, NOW())) RETURNING *", [habitIdValidation.parsed, date || null]);
    return res.status(201).json(r.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete("/habits/:id/logs/:logId", ensureAuth, async (req, res, next) => {
  const habitIdValidation = validateNumericId(req.params.id, "Habit ID");
  if (!habitIdValidation.isValid) return res.status(400).json({ message: habitIdValidation.error });
  const logIdValidation = validateNumericId(req.params.logId, "Log ID");
  if (!logIdValidation.isValid) return res.status(400).json({ message: logIdValidation.error });

  try {
    const logResult = await pool.query(
      `SELECT hl.id, h.userid FROM habitlog hl JOIN habits h ON hl.habitid = h.id WHERE hl.id = $1 AND hl.habitid = $2`,
      [logIdValidation.parsed, habitIdValidation.parsed]
    );
    if (logResult.rows.length === 0) return res.status(404).json({ message: "Log not found" });
    const row = logResult.rows[0];
    if (row.userid && Number(row.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const r = await pool.query("DELETE FROM habitlog WHERE id = $1 AND habitid = $2 RETURNING *", [logIdValidation.parsed, habitIdValidation.parsed]);
    return res.json({ message: "Log deleted", log: r.rows[0] });
  } catch (err) {
    return next(err);
  }
});

export default router;
