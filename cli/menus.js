import inquirer from "inquirer";
import { showActions } from "./common.js";

export function createCliApp(actions) {
  async function habitsMenu(currentUser) {
    while (true) {
      showActions("Habits Actions", [
        { label: "view habits", command: "view" },
        { label: "create habit", command: "create" },
        { label: "update habit", command: "update" },
        { label: "delete habit", command: "delete" },
        { label: "go back", command: "back" },
      ]);
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "Habits actions: (view, create, update, delete, back)",
          choices: [
            { name: "view habits (view)", value: "view" },
            { name: "create habit (create)", value: "create" },
            { name: "update habit (update)", value: "update" },
            { name: "delete habit (delete)", value: "delete" },
            { name: "go back (back)", value: "back" },
          ],
        },
      ]);

      switch (action) {
        case "view":
          await actions.getHabits();
          continue;
        case "create":
          await actions.createHabit(currentUser);
          continue;
        case "update":
          await actions.updateHabit();
          continue;
        case "delete":
          await actions.deleteHabit();
          continue;
        case "back":
          return;
      }
    }
  }

  async function usersMenu() {
    while (true) {
      showActions("Users Actions", [
        { label: "view users", command: "view" },
        { label: "create user", command: "create" },
        { label: "update user", command: "update" },
        { label: "delete user", command: "delete" },
        { label: "go back", command: "back" },
      ]);
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "Users actions (view, create, update, delete, back):",
          choices: [
            { name: "view users (view)", value: "view" },
            { name: "create user (create)", value: "create" },
            { name: "update user (update)", value: "update" },
            { name: "delete user (delete)", value: "delete" },
            { name: "go back (back)", value: "back" },
          ],
        },
      ]);

      switch (action) {
        case "view":
          await actions.getUsers();
          continue;
        case "create":
          await actions.createUser();
          continue;
        case "update":
          await actions.updateUser();
          continue;
        case "delete":
          await actions.deleteUser();
          continue;
        case "back":
          return;
      }
    }
  }

  async function categoriesMenu() {
    while (true) {
      showActions("Categories Actions", [
        { label: "view categories", command: "view" },
        { label: "create category", command: "create" },
        { label: "update category", command: "update" },
        { label: "delete category", command: "delete" },
        { label: "go back", command: "back" },
      ]);
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "Categories actions: (view, create, update, delete, back)",
          choices: [
            { name: "view categories (view)", value: "view" },
            { name: "create category (create)", value: "create" },
            { name: "update category (update)", value: "update" },
            { name: "delete category (delete)", value: "delete" },
            { name: "go back (back)", value: "back" },
          ],
        },
      ]);

      switch (action) {
        case "view":
          await actions.getCategories();
          continue;
        case "create":
          await actions.createCategory();
          continue;
        case "update":
          await actions.updateCategory();
          continue;
        case "delete":
          await actions.deleteCategory();
          continue;
        case "back":
          return;
      }
    }
  }

  async function habitCategoriesMenu() {
    while (true) {
      showActions("Habit-Category Links", [
        { label: "view links", command: "view" },
        { label: "link category", command: "link" },
        { label: "unlink category", command: "unlink" },
        { label: "go back", command: "back" },
      ]);
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "Habit-Category Links actions: (view, link, unlink, back)",
          choices: [
            { name: "view links (view)", value: "view" },
            { name: "link category (link)", value: "link" },
            { name: "unlink category (unlink)", value: "unlink" },
            { name: "go back (back)", value: "back" },
          ],
        },
      ]);

      switch (action) {
        case "view":
          await actions.getHabitCategories();
          continue;
        case "link":
          await actions.linkCategoryToHabit();
          continue;
        case "unlink":
          await actions.unlinkCategoryFromHabit();
          continue;
        case "back":
          return;
      }
    }
  }

  async function logsMenu() {
    while (true) {
      showActions("Habit Logs Actions", [
        { label: "view logs", command: "view" },
        { label: "add log", command: "add" },
        { label: "delete log", command: "delete" },
        { label: "go back", command: "back" },
      ]);
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "Habit Logs actions: (view, add, delete, back)",
          choices: [
            { name: "view logs (view)", value: "view" },
            { name: "add log (add)", value: "add" },
            { name: "delete log (delete)", value: "delete" },
            { name: "go back (back)", value: "back" },
          ],
        },
      ]);

      switch (action) {
        case "view":
          await actions.getHabitLogs();
          continue;
        case "add":
          await actions.addHabitLog();
          continue;
        case "delete":
          await actions.deleteHabitLog();
          continue;
        case "back":
          return;
      }
    }
  }

  async function remindersMenu() {
    while (true) {
      showActions("Reminder Actions", [
        { label: "view reminders", command: "view" },
        { label: "add reminder", command: "add" },
        { label: "update reminder", command: "update" },
        { label: "delete reminder", command: "delete" },
        { label: "go back", command: "back" },
      ]);
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "Reminders actions: (view, add, update, delete, back)",
          choices: [
            { name: "view reminders (view)", value: "view" },
            { name: "add reminder (add)", value: "add" },
            { name: "update reminder (update)", value: "update" },
            { name: "delete reminder (delete)", value: "delete" },
            { name: "go back (back)", value: "back" },
          ],
        },
      ]);

      switch (action) {
        case "view":
          await actions.getReminders();
          continue;
        case "add":
          await actions.addReminder();
          continue;
        case "update":
          await actions.updateReminder();
          continue;
        case "delete":
          await actions.deleteReminder();
          continue;
        case "back":
          return;
      }
    }
  }

  async function todayChecklistMenu() {
    while (true) {
      showActions("Today Checklist", [
        { label: "view today's checklist", command: "view" },
        { label: "mark habit done", command: "done" },
        { label: "mark habit skipped", command: "skip" },
        { label: "view one habit streak", command: "streak" },
        { label: "view all streaks", command: "streaks" },
        { label: "view habit stats", command: "stats" },
        { label: "go back", command: "back" },
      ]);

      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "Today checklist actions: (view, done, skip, streak, streaks, stats, back)",
          choices: [
            { name: "view today's checklist (view)", value: "view" },
            { name: "mark habit done (done)", value: "done" },
            { name: "mark habit skipped (skip)", value: "skip" },
            { name: "view one habit streak (streak)", value: "streak" },
            { name: "view all streaks (streaks)", value: "streaks" },
            { name: "view habit stats (stats)", value: "stats" },
            { name: "go back (back)", value: "back" },
          ],
        },
      ]);

      switch (action) {
        case "view":
          await actions.viewTodayChecklist();
          continue;
        case "done":
          await actions.updateTodayHabitStatus("done");
          continue;
        case "skip":
          await actions.updateTodayHabitStatus("skipped");
          continue;
        case "streak":
          await actions.viewHabitStreak();
          continue;
        case "streaks":
          await actions.viewAllStreaks();
          continue;
        case "stats":
          await actions.viewHabitStats();
          continue;
        case "back":
          return;
      }
    }
  }

  async function myHabitsMenu(currentUser) {
    while (true) {
      showActions("My Habits", [
        { label: "create habit", command: "create" },
        { label: "view habits", command: "view" },
        { label: "update habit", command: "update" },
        { label: "delete habit", command: "delete" },
        { label: "go back", command: "back" },
      ]);
      console.log("Create flow: name -> frequency -> category -> reminder.\n");
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "My Habits: (create, view, delete, back)",
          choices: [
            { name: "create habit (create)", value: "create" },
            { name: "view habits (view)", value: "view" },
            { name: "update habit (update)", value: "update" },
            { name: "delete habit (delete)", value: "delete" },
            { name: "go back (back)", value: "back" },
          ],
        },
      ]);

      switch (action) {
        case "create":
          await actions.createHabit(currentUser);
          continue;
        case "view":
          await actions.getHabits();
          continue;
        case "update":
          await actions.updateHabit();
          continue;
        case "delete":
          await actions.deleteHabit();
          continue;
        case "back":
          return;
      }
    }
  }

  async function basicUserMenu(currentUser) {
    showActions(`Basic User Menu (${currentUser.email})`, [
      { label: "myHabits", command: "habits" },
      { label: "habit categories", command: "categories" },
      { label: "today checklist", command: "today" },
      { label: "logout", command: "logout" },
    ]);
    const { module } = await inquirer.prompt([
      {
        type: "list",
        name: "module",
        message: `Basic user menu (${currentUser.email}):`,
        choices: [
          { name: "myHabits (habits)", value: "habits" },
          { name: "habit categories (categories)", value: "categories" },
          { name: "today checklist (today)", value: "today" },
          { name: "logout (logout)", value: "logout" },
        ],
      },
    ]);

    switch (module) {
      case "habits":
        await myHabitsMenu(currentUser);
        break;
      case "categories":
        await categoriesMenu();
        break;
      case "today":
        await todayChecklistMenu();
        break;
      case "logout":
        actions.clearApiAuthToken();
        return false;
    }

    return true;
  }

  async function adminMenu(currentUser) {
    console.log(`\nAdmin menu (${currentUser.email})\n`);
    showActions("Admin Menu", [
      { label: "habits actions", command: "habits" },
      { label: "categories actions", command: "categories" },
      { label: "users actions", command: "users" },
      { label: "more actions", command: "more" },
      { label: "logout", command: "logout" },
    ]);

    const { module } = await inquirer.prompt([
      {
        type: "list",
        name: "module",
        message: "Select an action group: (habits, categories, users, more, logout)",
        choices: [
          { name: "Habits actions (habits)", value: "habits" },
          { name: "Categories actions (categories)", value: "categories" },
          { name: "Users actions (users)", value: "users" },
          { name: "More (logs / reminders / links) (more)", value: "more" },
          { name: "Logout (logout)", value: "logout" },
        ],
      },
    ]);

    switch (module) {
      case "habits":
        await habitsMenu(currentUser);
        break;
      case "users":
        await usersMenu();
        break;
      case "categories":
        await categoriesMenu();
        break;
      case "more":
        showActions("More Actions", [
          { label: "habit-category links", command: "links" },
          { label: "habit logs", command: "logs" },
          { label: "reminders", command: "reminders" },
          { label: "go back", command: "back" },
        ]);
        const { moreChoice } = await inquirer.prompt([
          {
            type: "list",
            name: "moreChoice",
            message: "More actions: (links, logs, reminders, back)",
            choices: [
              { name: "Habit-Category Links (links)", value: "links" },
              { name: "Logs (logs)", value: "logs" },
              { name: "Reminders (reminders)", value: "reminders" },
              { name: "Back (back)", value: "back" },
            ],
          },
        ]);

        if (moreChoice === "links") await habitCategoriesMenu();
        if (moreChoice === "logs") await logsMenu();
        if (moreChoice === "reminders") await remindersMenu();
        break;
      case "logout":
        actions.clearApiAuthToken();
        return false;
    }

    return true;
  }

  async function authMenu() {
    showActions("Welcome", [
      { label: "register", command: "register" },
      { label: "login", command: "login" },
      { label: "exit", command: "exit" },
    ]);
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Welcome. Select action:",
        choices: [
          { name: "register (register)", value: "register" },
          { name: "login (login)", value: "login" },
          { name: "exit (exit)", value: "exit" },
        ],
      },
    ]);

    if (action === "register") {
      await actions.registerFlow();
      return null;
    }
    if (action === "login") {
      return await actions.loginFlow();
    }

    console.log("Goodbye");
    process.exit(0);
  }

  async function main() {
    console.clear();
    console.log("\n=== Habits Manager ===\n");

    let currentUser = null;

    while (!currentUser) {
      currentUser = await authMenu();
    }

    let keepRunning = true;
    while (keepRunning) {
      if (currentUser.role === "admin") {
        keepRunning = await adminMenu(currentUser);
      } else {
        keepRunning = await basicUserMenu(currentUser);
      }
    }

    const { loginAgain } = await inquirer.prompt([
      {
        type: "confirm",
        name: "loginAgain",
        message: "Return to login/register screen?",
        default: true,
      },
    ]);

    if (loginAgain) {
      await main();
    } else {
      console.log("Goodbye");
      process.exit(0);
    }
  }

  return { main };
}
