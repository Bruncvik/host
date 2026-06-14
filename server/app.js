import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import habitsRouter from "./routes/habits.js";
import usersRouter from "./routes/users.js";
import categoriesRouter from "./routes/categories.js";
import habitCategoriesRouter from "./routes/habitCategories.js";
import habitLogsRouter from "./routes/habitLogs.js";
import remindersRouter from "./routes/reminders.js";
import habitDayStatusRouter from "./routes/habitDayStatus.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { startReminderScheduler } from "./services/reminderService.js";
import { rateLimitRequests, resetRateLimitBuckets } from "./middleware/requestLimits.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const app = express();

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

app.use(cors());
app.use(rateLimitRequests);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Mount more specific routers first to prevent route conflicts
app.use(habitLogsRouter);
app.use(remindersRouter);
app.use(habitCategoriesRouter);
app.use(habitDayStatusRouter);
app.use(habitsRouter);
app.use(categoriesRouter);
app.use(usersRouter);

// Test-only endpoint to reset rate limit buckets
if (process.env.NODE_ENV !== 'production') {
	app.post('/__test__/reset-rate-limits', (req, res) => {
		resetRateLimitBuckets();
		res.json({ message: 'Rate limit buckets reset' });
	});
}

app.use(errorHandler);

startReminderScheduler();
