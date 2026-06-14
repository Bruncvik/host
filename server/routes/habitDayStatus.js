import express from "express";
import { pool } from "../config/db.js";
import { ensureAuth, requireAdmin } from "../middleware/auth.js";
import { validateHabitDayStatus, validateNumericId } from "../utils/validators.js";
import { RETENTION, STATUSES, WEEKDAYS } from "../constants.js";

const router = express.Router();

const RETENTION_DAYS = RETENTION.DAYS;
const ALLOWED_STATUSES = STATUSES.HABIT_DAY;
const WEEKDAY_KEYS = WEEKDAYS.KEYS;
const WEEKDAY_ALIASES = WEEKDAYS.ALIASES;

function normalizeFrequency(frequency) {
  return String(frequency || "")
    .toLowerCase()
    .trim();
}

function normalizeToken(token) {
  return token
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function frequencyContainsDay(frequency, dayKey) {
  const aliases = WEEKDAY_ALIASES[dayKey] || [];
  return aliases.some((alias) => frequency.includes(normalizeToken(alias)));
}

function isHabitDueToday(frequency, date = new Date()) {
  const normalized = normalizeToken(normalizeFrequency(frequency));
  if (!normalized) return false;

  // Common daily aliases.
  if (["daily", "every day", "kazdy den", "denne"].some((k) => normalized.includes(normalizeToken(k)))) {
    return true;
  }

  const dayIndex = date.getDay();
  const todayKey = WEEKDAY_KEYS[dayIndex];
  const isWeekday = dayIndex >= 1 && dayIndex <= 5;

  if (["weekdays", "working days", "pracovni dny", "pracovni den", "weekday"].some((k) => normalized.includes(normalizeToken(k)))) {
    return isWeekday;
  }

  if (["weekends", "weekend", "vikend"].some((k) => normalized.includes(normalizeToken(k)))) {
    return !isWeekday;
  }

  // If text explicitly mentions today's day token, treat as due today.
  if (frequencyContainsDay(normalized, todayKey)) {
    return true;
  }

  // Generic "weekly" with no day specified defaults to due today.
  if (normalized.includes("weekly") || normalized.includes("tydne") || normalized.includes("týdně")) {
    return true;
  }

  return false;
}

async function cleanupOldStatuses() {
  const result = await pool.query(
    "DELETE FROM habitdaystatus WHERE daydate < CURRENT_DATE - $1::int RETURNING id",
    [RETENTION_DAYS]
  );
  return result.rowCount;
}

async function initializeTodayStatuses() {
  const habitsResult = await pool.query("SELECT id, frequency FROM habits");
  const dueHabitIds = habitsResult.rows
    .filter((habit) => isHabitDueToday(habit.frequency))
    .map((habit) => habit.id);

  if (dueHabitIds.length === 0) return;

  await pool.query(
    `INSERT INTO habitdaystatus (habitid, daydate, status)
     SELECT habit_id, CURRENT_DATE, 'pending'
     FROM UNNEST($1::int[]) AS habit_id
     ON CONFLICT (habitid, daydate) DO NOTHING`,
    [dueHabitIds]
  );
}

function computeStreaks(rows) {
  // Rows are expected in descending day order (newest first).
  let currentStreak = 0;
  let longestStreak = 0;
  let runningDoneCount = 0;

  for (const row of rows) {
    const status = row.status;
    if (status === "done") {
      runningDoneCount += 1;
    } else if (status === "skipped") {
      // Skip days are neutral for streak continuity.
    } else {
      if (runningDoneCount > longestStreak) {
        longestStreak = runningDoneCount;
      }
      if (currentStreak === 0) {
        currentStreak = runningDoneCount;
      }
      runningDoneCount = 0;
    }
  }

  if (runningDoneCount > longestStreak) {
    longestStreak = runningDoneCount;
  }
  if (currentStreak === 0) {
    currentStreak = runningDoneCount;
  }

  return { currentStreak, longestStreak };
}

function dateToIso(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

router.get("/habits/today/checklist", ensureAuth, async (req, res, next) => {
  try {
    await cleanupOldStatuses();
    await initializeTodayStatuses();

    let result;
    if (req.user.role === "admin") {
      result = await pool.query(
        `SELECT
           hds.id,
           hds.habitid,
           h.name,
           h.frequency,
           hds.daydate,
           hds.status,
           hds.completedat
         FROM habitdaystatus hds
         JOIN habits h ON h.id = hds.habitid
         WHERE hds.daydate = CURRENT_DATE
         ORDER BY h.id DESC`
      );
    } else {
      result = await pool.query(
        `SELECT
           hds.id,
           hds.habitid,
           h.name,
           h.frequency,
           hds.daydate,
           hds.status,
           hds.completedat
         FROM habitdaystatus hds
         JOIN habits h ON h.id = hds.habitid
         WHERE hds.daydate = CURRENT_DATE AND h.userid = $1
         ORDER BY h.id DESC`,
        [req.user.id]
      );
    }

    const items = result.rows;
    const summary = {
      total: items.length,
      pending: items.filter((item) => item.status === "pending").length,
      done: items.filter((item) => item.status === "done").length,
      skipped: items.filter((item) => item.status === "skipped").length,
      missed: items.filter((item) => item.status === "missed").length,
    };

    return res.json({
      date: new Date().toISOString().slice(0, 10),
      retentionDays: RETENTION_DAYS,
      summary,
      items,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/habits/:id/today-status", ensureAuth, async (req, res, next) => {
  const habitIdValidation = validateNumericId(req.params.id, "Habit ID");
  if (!habitIdValidation.isValid) {
    return res.status(400).json({ message: habitIdValidation.error });
  }

  try {
    const habitResult = await pool.query("SELECT id, frequency, userid FROM habits WHERE id = $1", [
      habitIdValidation.parsed,
    ]);
    if (habitResult.rows.length === 0) {
      return res.status(404).json({ message: "Habit not found" });
    }
    const habit = habitResult.rows[0];
    if (habit.userid && Number(habit.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    await cleanupOldStatuses();
    await initializeTodayStatuses();

    const statusResult = await pool.query(
      `SELECT id, habitid, daydate, status, completedat
       FROM habitdaystatus
       WHERE habitid = $1 AND daydate = CURRENT_DATE`,
      [habitIdValidation.parsed]
    );

    if (statusResult.rows.length === 0) {
      return res.status(404).json({ message: "No status for today" });
    }

    return res.json(statusResult.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.put("/habits/:id/today-status", ensureAuth, async (req, res, next) => {
  const { status } = req.body;
  const habitIdValidation = validateNumericId(req.params.id, "Habit ID");
  if (!habitIdValidation.isValid) {
    return res.status(400).json({ message: habitIdValidation.error });
  }

  const statusValidation = validateHabitDayStatus(status);
  if (!statusValidation.isValid) {
    return res.status(400).json({ message: statusValidation.error });
  }

  try {
    const habitResult = await pool.query("SELECT id, frequency, userid FROM habits WHERE id = $1", [
      habitIdValidation.parsed,
    ]);
    if (habitResult.rows.length === 0) {
      return res.status(404).json({ message: "Habit not found" });
    }
    const habitRow = habitResult.rows[0];
    if (habitRow.userid && Number(habitRow.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }
    
    await initializeTodayStatuses();
    const selectedHabit = habitRow;
    if (!isHabitDueToday(selectedHabit.frequency)) {
      return res.status(400).json({ message: "Habit is not due today" });
    }

    const completedAt = statusValidation.sanitized === "done" ? "NOW()" : "NULL";
    const updateQuery =
      `UPDATE habitdaystatus
       SET status = $1,
           completedat = ${completedAt},
           updatedat = NOW()
       WHERE habitid = $2 AND daydate = CURRENT_DATE
       RETURNING *`;

    const updateResult = await pool.query(updateQuery, [statusValidation.sanitized, habitIdValidation.parsed]);
    if (updateResult.rows.length === 0) {
      return res.status(400).json({ message: "Habit is not due today" });
    }

    if (statusValidation.sanitized === "done") {
      await pool.query(
        `INSERT INTO habitlog (habitid, date)
         SELECT $1, NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM habitlog WHERE habitid = $1 AND DATE(date) = CURRENT_DATE
         )`,
        [habitIdValidation.parsed]
      );
    }

    return res.json(updateResult.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post("/habits/today/cleanup", requireAdmin, async (req, res, next) => {
  try {
    const deletedCount = await cleanupOldStatuses();
    return res.json({
      message: "Old daily statuses cleaned",
      retentionDays: RETENTION_DAYS,
      deletedCount,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/habits/:id/streak", ensureAuth, async (req, res, next) => {
  const habitIdValidation = validateNumericId(req.params.id, "Habit ID");
  if (!habitIdValidation.isValid) {
    return res.status(400).json({ message: habitIdValidation.error });
  }

  try {
    await cleanupOldStatuses();
    await initializeTodayStatuses();
    const habitResult = await pool.query("SELECT id, name, userid FROM habits WHERE id = $1", [habitIdValidation.parsed]);
    if (habitResult.rows.length === 0) {
      return res.status(404).json({ message: "Habit not found" });
    }
    const habitRow = habitResult.rows[0];
    if (habitRow.userid && Number(habitRow.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const statusResult = await pool.query(
      `SELECT daydate, status
       FROM habitdaystatus
       WHERE habitid = $1
       ORDER BY daydate DESC`,
      [habitIdValidation.parsed]
    );

    const streaks = computeStreaks(statusResult.rows);
    return res.json({
      habitId: habitIdValidation.parsed,
      habitName: habitResult.rows[0].name,
      retentionDays: RETENTION_DAYS,
      daysInWindow: statusResult.rows.length,
      ...streaks,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/habits/:id/stats", ensureAuth, async (req, res, next) => {
  const habitIdValidation = validateNumericId(req.params.id, "Habit ID");
  if (!habitIdValidation.isValid) {
    return res.status(400).json({ message: habitIdValidation.error });
  }

  try {
    await cleanupOldStatuses();
    await initializeTodayStatuses();

    const parsedDays = Number.parseInt(req.query.days, 10);
    const days = Number.isFinite(parsedDays) && parsedDays > 0 ? Math.min(parsedDays, RETENTION_DAYS) : RETENTION_DAYS;

    const habitResult = await pool.query("SELECT id, name, frequency, userid FROM habits WHERE id = $1", [habitIdValidation.parsed]);
    if (habitResult.rows.length === 0) {
      return res.status(404).json({ message: "Habit not found" });
    }
    const habitRow = habitResult.rows[0];
    if (habitRow.userid && Number(habitRow.userid) !== Number(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const statusResult = await pool.query(
      `SELECT daydate, status
       FROM habitdaystatus
       WHERE habitid = $1
         AND daydate >= CURRENT_DATE - ($2::int - 1)
       ORDER BY daydate DESC`,
      [habitIdValidation.parsed, days]
    );

    const statusesByDay = new Map(statusResult.rows.map((row) => [dateToIso(row.daydate), row.status]));
    const habit = habitResult.rows[0];

    const items = [];
    let dueDays = 0;
    let completedDays = 0;
    let skippedDays = 0;
    let missedDays = 0;
    let pendingDays = 0;
    let notRecordedDueDays = 0;

    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const dayDate = new Date();
      dayDate.setHours(0, 0, 0, 0);
      dayDate.setDate(dayDate.getDate() - offset);

      const dayKey = dayDate.toISOString().slice(0, 10);
      const isDue = isHabitDueToday(habit.frequency, dayDate);
      const storedStatus = statusesByDay.get(dayKey);
      const status = isDue ? storedStatus || "not-recorded" : "not-due";
      const completed = isDue && status === "done";

      if (isDue) {
        dueDays += 1;
        if (completed) {
          completedDays += 1;
        } else if (status === "skipped") {
          skippedDays += 1;
        } else if (status === "missed") {
          missedDays += 1;
        } else if (status === "pending") {
          pendingDays += 1;
        } else if (status === "not-recorded") {
          notRecordedDueDays += 1;
        }
      }

      items.push({
        date: dayKey,
        isDue,
        status,
        completed,
      });
    }

    const notCompletedDays = dueDays - completedDays;
    const completionRatePct = dueDays === 0 ? 0 : Number(((completedDays / dueDays) * 100).toFixed(2));

    return res.json({
      habitId: habitIdValidation.parsed,
      habitName: habit.name,
      frequency: habit.frequency,
      retentionDays: RETENTION_DAYS,
      daysRequested: days,
      summary: {
        dueDays,
        completedDays,
        notCompletedDays,
        skippedDays,
        missedDays,
        pendingDays,
        notRecordedDueDays,
        completionRatePct,
      },
      items,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/habits/streaks/all", ensureAuth, async (req, res, next) => {
  try {
    await cleanupOldStatuses();
    await initializeTodayStatuses();

    let habitsResult;
    if (req.user.role === "admin") {
      habitsResult = await pool.query("SELECT id, name FROM habits ORDER BY id DESC");
    } else {
      habitsResult = await pool.query("SELECT id, name FROM habits WHERE userid = $1 ORDER BY id DESC", [req.user.id]);
    }
    const streakItems = [];

    for (const habit of habitsResult.rows) {
      const statusResult = await pool.query(
        `SELECT daydate, status
         FROM habitdaystatus
         WHERE habitid = $1
         ORDER BY daydate DESC`,
        [habit.id]
      );
      const streaks = computeStreaks(statusResult.rows);
      streakItems.push({
        habitId: habit.id,
        habitName: habit.name,
        daysInWindow: statusResult.rows.length,
        ...streaks,
      });
    }

    return res.json({
      retentionDays: RETENTION_DAYS,
      totalHabits: streakItems.length,
      items: streakItems,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
