import nodemailer from "nodemailer";
import cron from "node-cron";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function sendReminderEmail(habitName, recipientEmail) {
  const motivations = [
    "You've got this! Let's build a better habit today.",
    "Time to level up! Go make it happen.",
    "Every day is a chance to be better. Let's go!",
    "Your future self will thank you for this effort.",
    "Consistency is key. You're doing great!",
    "This is your moment. Go crush it!",
  ];
  const motivation = motivations[Math.floor(Math.random() * motivations.length)];

  return transporter.sendMail({
    from: process.env.SMTP_USER,
    to: recipientEmail,
    subject: `Reminder: Time for ${habitName}!`,
    html: `
      <h2>Habit Reminder</h2>
      <p>It's time to work on your habit: <strong>${habitName}</strong></p>
      <p style="font-style: italic; color: #666;">"${motivation}"</p>
      <p>Keep up the great work!</p>
    `,
  });
}

export function startReminderScheduler() {
  cron.schedule("* * * * *", () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    pool
      .query(
        `SELECT r.id, r.time, h.id as habit_id, h.name, u.email as recipient_email
         FROM reminder r
         JOIN habits h ON r.habitid = h.id
         LEFT JOIN users u ON u.id = h.userid
         WHERE r.time = $1`,
        [currentTime]
      )
      .then((result) => {
        for (const reminder of result.rows) {
          const recipientEmail = reminder.recipient_email || process.env.TEST_EMAIL;
          sendReminderEmail(reminder.name, recipientEmail).catch((err) =>
            console.error(`Failed to send reminder email for habit ${reminder.name}:`, err.message)
          );
        }
      })
      .catch((err) => console.error("Error checking reminders:", err.message));
  });

  console.log("Reminder service started. Checking for reminders every minute.");
}
