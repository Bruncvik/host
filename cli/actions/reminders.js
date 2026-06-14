import inquirer from "inquirer";

export function createReminderActions(api) {
  async function getReminders() {
    const { habitId } = await inquirer.prompt([
      { type: "input", name: "habitId", message: "Habit ID:" },
    ]);

    const response = await api.get(`/habits/${habitId}/reminders`);
    console.log("\nReminders for Habit " + habitId + "\n");
    if (response.data.length === 0) {
      console.log("No reminders set.");
      return;
    }
    response.data.forEach((reminder, index) => {
      console.log(`${index + 1}. [${reminder.id}] ${reminder.time}`);
    });
  }

  async function addReminder() {
    const { habitId, time } = await inquirer.prompt([
      { type: "input", name: "habitId", message: "Habit ID:" },
      { type: "input", name: "time", message: "Time (HH:MM):" },
    ]);

    await api.post(`/habits/${habitId}/reminders`, { time });
    console.log(" Reminder created");
  }

  async function updateReminder() {
    const { reminderId, time } = await inquirer.prompt([
      { type: "input", name: "reminderId", message: "Reminder ID:" },
      { type: "input", name: "time", message: "New time (HH:MM):" },
    ]);

    await api.put(`/reminders/${reminderId}`, { time });
    console.log(" Reminder updated");
  }

  async function deleteReminder() {
    const { reminderId } = await inquirer.prompt([
      { type: "input", name: "reminderId", message: "Reminder ID to delete:" },
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

    await api.delete(`/reminders/${reminderId}`);
    console.log(" Reminder deleted");
  }

  return {
    getReminders,
    addReminder,
    updateReminder,
    deleteReminder,
  };
}
