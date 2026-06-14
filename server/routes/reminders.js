import express from "express";
import { pool } from "../config/db.js";
import { ensureAuth } from "../middleware/auth.js";
import { validateNumericId, validateReminderTime } from "../utils/validators.js";

const router = express.Router();

router.get("/habits/:id/reminders", ensureAuth, async (req, res, next) => {
  const habitIdValidation = validateNumericId(req.params.id, "Habit ID");
  if (!habitIdValidation.isValid) return res.status(400).json({ message: habitIdValidation.error });

  try {
    const habitResult = await pool.query("SELECT userid FROM habits WHERE id = $1", [habitIdValidation.parsed]);
    if (habitResult.rows.length === 0) return res.status(404).json({ message: "Habit not found" });
    const habit = habitResult.rows[0];
    if (habit.userid && Number(habit.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const r = await pool.query("SELECT * FROM reminder WHERE habitid = $1", [habitIdValidation.parsed]);
    return res.json(r.rows);
  } catch (err) {
    return next(err);
  }
});

router.post("/habits/:id/reminders", ensureAuth, async (req, res, next) => {
  const { time } = req.body;
  const habitIdValidation = validateNumericId(req.params.id, "Habit ID");
  if (!habitIdValidation.isValid) return res.status(400).json({ message: habitIdValidation.error });

  const validation = validateReminderTime(time);
  if (!validation.isValid) {
    return res.status(400).json({ message: validation.error });
  }

  try {
    const habitResult = await pool.query("SELECT userid FROM habits WHERE id = $1", [habitIdValidation.parsed]);
    if (habitResult.rows.length === 0) return res.status(404).json({ message: "Habit not found" });
    const habit = habitResult.rows[0];
    if (habit.userid && Number(habit.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const r = await pool.query("INSERT INTO reminder (habitid, time) VALUES ($1, $2) RETURNING *", [
      habitIdValidation.parsed,
      validation.sanitized,
    ]);
    return res.status(201).json(r.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.put("/reminders/:id", ensureAuth, async (req, res, next) => {
  const { time } = req.body;
  if (time === undefined) return res.status(400).json({ message: "No fields to update" });
  const idValidation = validateNumericId(req.params.id, "Reminder ID");
  if (!idValidation.isValid) return res.status(400).json({ message: idValidation.error });

  const validation = validateReminderTime(time);
  if (!validation.isValid) {
    return res.status(400).json({ message: validation.error });
  }

  try {
    const rem = await pool.query("SELECT r.id, h.userid FROM reminder r JOIN habits h ON r.habitid = h.id WHERE r.id = $1", [
      idValidation.parsed,
    ]);
    if (rem.rows.length === 0) return res.status(404).json({ message: "Reminder not found" });
    const row = rem.rows[0];
    if (row.userid && Number(row.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const r = await pool.query("UPDATE reminder SET time = $1 WHERE id = $2 RETURNING *", [validation.sanitized, idValidation.parsed]);
    return res.json(r.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete("/reminders/:id", ensureAuth, async (req, res, next) => {
  const idValidation = validateNumericId(req.params.id, "Reminder ID");
  if (!idValidation.isValid) return res.status(400).json({ message: idValidation.error });

  try {
    const rem = await pool.query("SELECT r.id, h.userid FROM reminder r JOIN habits h ON r.habitid = h.id WHERE r.id = $1", [
      idValidation.parsed,
    ]);
    if (rem.rows.length === 0) return res.status(404).json({ message: "Reminder not found" });
    const row = rem.rows[0];
    if (row.userid && Number(row.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const r = await pool.query("DELETE FROM reminder WHERE id = $1 RETURNING *", [idValidation.parsed]);
    return res.json({ message: "Reminder deleted", reminder: r.rows[0] });
  } catch (err) {
    return next(err);
  }
});

export default router;
