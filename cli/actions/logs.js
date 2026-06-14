import inquirer from "inquirer";

export function createLogActions(api) {
  async function getHabitLogs() {
    const { habitId } = await inquirer.prompt([
      { type: "input", name: "habitId", message: "Habit ID:" },
    ]);

    const response = await api.get(`/habits/${habitId}/logs`);
    console.log("\nLogs for Habit " + habitId + "\n");
    if (response.data.length === 0) {
      console.log("No logs found.");
      return;
    }
    response.data.forEach((log, index) => {
      console.log(`${index + 1}. [${log.id}] ${new Date(log.date).toLocaleString()}`);
    });
  }

  async function addHabitLog() {
    const { habitId } = await inquirer.prompt([
      { type: "input", name: "habitId", message: "Habit ID:" },
    ]);

    const response = await api.post(`/habits/${habitId}/logs`, {
      date: new Date().toISOString(),
    });
    console.log(" Log added:", new Date(response.data.date).toLocaleString());
  }

  async function deleteHabitLog() {
    const { habitId, logId } = await inquirer.prompt([
      { type: "input", name: "habitId", message: "Habit ID:" },
      { type: "input", name: "logId", message: "Log ID to delete:" },
    ]);

    const { confirmed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmed",
        message: "Are you sure?",
        default: false,
      },
    ]);

    if (!confirmed) {
      console.log("Cancelled");
      return;
    }

    await api.delete(`/habits/${habitId}/logs/${logId}`);
    console.log(" Log deleted");
  }

  return {
    getHabitLogs,
    addHabitLog,
    deleteHabitLog,
  };
}
