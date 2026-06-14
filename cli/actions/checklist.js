import inquirer from "inquirer";

export function createChecklistActions(api) {
  async function viewTodayChecklist() {
    const response = await api.get("/habits/today/checklist");
    const { date, retentionDays, summary, items } = response.data;

    console.log(`\nToday's habits checklist (${date})\n`);
    console.log(`Retention window: last ${retentionDays} days`);
    console.log(
      `Summary -> total: ${summary.total}, pending: ${summary.pending}, done: ${summary.done}, skipped: ${summary.skipped}, missed: ${summary.missed}`
    );

    if (items.length === 0) {
      console.log("No habits found.");
      return;
    }

    items.forEach((item, index) => {
      const doneAt = item.completedat ? ` | completed: ${new Date(item.completedat).toLocaleString()}` : "";
      console.log(`${index + 1}. [${item.habitid}] ${item.name} (${item.frequency}) -> ${item.status}${doneAt}`);
    });
  }

  async function updateTodayHabitStatus(status) {
    const checklistResponse = await api.get("/habits/today/checklist");
    const items = checklistResponse.data.items || [];

    if (items.length === 0) {
      console.log("No habits available for today.");
      return;
    }

    console.log("\nAvailable habits for today\n");
    items.forEach((item, index) => {
      console.log(`${index + 1}. [${item.habitid}] ${item.name} -> ${item.status}`);
    });

    const { habitId } = await inquirer.prompt([
      { type: "input", name: "habitId", message: `Habit ID to mark as ${status}:` },
    ]);

    await api.put(`/habits/${habitId}/today-status`, { status });
    console.log(` Habit marked as ${status} for today`);
  }

  async function cleanupOldTodayStatuses() {
    const response = await api.post("/habits/today/cleanup");
    console.log(
      ` Cleanup finished: removed ${response.data.deletedCount} rows older than ${response.data.retentionDays} days.`
    );
  }

  async function viewHabitStreak() {
    const habitsResponse = await api.get("/habits");
    const habits = habitsResponse.data || [];

    console.log("\nAvailable Habits (for streak)\n");
    if (habits.length === 0) {
      console.log("No habits found.");
      return;
    }

    habits.forEach((habit, index) => {
      console.log(`${index + 1}. [${habit.id}] ${habit.name} (${habit.frequency})`);
    });

    const { habitId } = await inquirer.prompt([
      { type: "input", name: "habitId", message: "Habit ID:" },
    ]);

    const response = await api.get(`/habits/${habitId}/streak`);
    const data = response.data;
    console.log(`\nStreak for habit [${data.habitId}] ${data.habitName}\n`);
    console.log(`Current streak: ${data.currentStreak}`);
    console.log(`Longest streak: ${data.longestStreak}`);
    console.log(`Tracked days in window: ${data.daysInWindow} (retention ${data.retentionDays} days)`);
  }

  async function viewAllStreaks() {
    const response = await api.get("/habits/streaks/all");
    const data = response.data;

    console.log(`\nAll Habit Streaks (retention ${data.retentionDays} days)\n`);
    if (data.items.length === 0) {
      console.log("No habits found.");
      return;
    }

    data.items.forEach((item, index) => {
      console.log(
        `${index + 1}. [${item.habitId}] ${item.habitName} -> current: ${item.currentStreak}, longest: ${item.longestStreak}`
      );
    });
  }

  async function viewHabitStats() {
    const habitsResponse = await api.get("/habits");
    const habits = habitsResponse.data || [];

    console.log("\nAvailable Habits (for stats)\n");
    if (habits.length === 0) {
      console.log("No habits found.");
      return;
    }

    habits.forEach((habit, index) => {
      console.log(`${index + 1}. [${habit.id}] ${habit.name} (${habit.frequency})`);
    });

    const answers = await inquirer.prompt([
      { type: "input", name: "habitId", message: "Habit ID:" },
      {
        type: "input",
        name: "days",
        message: "How many last days to display? (1-30)",
        default: "30",
        validate: (input) => {
          const parsed = Number.parseInt(input, 10);
          if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) {
            return "Enter a whole number between 1 and 30";
          }
          return true;
        },
      },
    ]);

    const response = await api.get(`/habits/${answers.habitId}/stats`, {
      params: { days: Number.parseInt(answers.days, 10) },
    });

    const data = response.data;
    console.log(`\nStats for habit [${data.habitId}] ${data.habitName}\n`);
    console.log(`Frequency: ${data.frequency}`);
    console.log(`Window: last ${data.daysRequested} day(s), retention ${data.retentionDays}`);
    console.log(
      `Summary -> due: ${data.summary.dueDays}, completed: ${data.summary.completedDays}, not completed: ${data.summary.notCompletedDays}, rate: ${data.summary.completionRatePct}%`
    );
    console.log(
      `Breakdown -> skipped: ${data.summary.skippedDays}, missed: ${data.summary.missedDays}, pending: ${data.summary.pendingDays}, not recorded due days: ${data.summary.notRecordedDueDays}`
    );
    console.log("\nDaily details\n");

    data.items.forEach((item, index) => {
      const completionText = item.isDue ? (item.completed ? "COMPLETED" : "NOT COMPLETED") : "NOT DUE";
      console.log(`${index + 1}. ${item.date} -> ${completionText} (status: ${item.status})`);
    });
  }

  return {
    viewTodayChecklist,
    updateTodayHabitStatus,
    cleanupOldTodayStatuses,
    viewHabitStreak,
    viewAllStreaks,
    viewHabitStats,
  };
}
