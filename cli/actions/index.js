import { createAuthActions } from "./auth.js";
import { createHabitActions } from "./habits.js";
import { createCategoryActions } from "./categories.js";
import { createReminderActions } from "./reminders.js";
import { createUserActions } from "./users.js";
import { createLogActions } from "./logs.js";
import { createChecklistActions } from "./checklist.js";

/**
 * Factory function that creates all CLI actions
 * Combines actions from all submodules into a single object
 * @param {AxiosInstance} api - Configured axios instance for API calls
 * @returns {Object} - All available CLI actions
 */
export function createCliActions(api) {
  const authActions = createAuthActions(api);
  const habitActions = createHabitActions(api);
  const categoryActions = createCategoryActions(api);
  const reminderActions = createReminderActions(api);
  const userActions = createUserActions(api);
  const logActions = createLogActions(api);
  const checklistActions = createChecklistActions(api);

  return {
    // Auth actions
    setApiAuthToken: authActions.setApiAuthToken,
    clearApiAuthToken: authActions.clearApiAuthToken,
    registerFlow: authActions.registerFlow,
    loginFlow: authActions.loginFlow,

    // Habit actions
    getHabits: habitActions.getHabits,
    createHabit: habitActions.createHabit,
    updateHabit: habitActions.updateHabit,
    deleteHabit: habitActions.deleteHabit,

    // Category actions
    getCategories: categoryActions.getCategories,
    createCategory: categoryActions.createCategory,
    updateCategory: categoryActions.updateCategory,
    deleteCategory: categoryActions.deleteCategory,
    getHabitCategories: categoryActions.getHabitCategories,
    linkCategoryToHabit: categoryActions.linkCategoryToHabit,
    unlinkCategoryFromHabit: categoryActions.unlinkCategoryFromHabit,

    // Reminder actions
    getReminders: reminderActions.getReminders,
    addReminder: reminderActions.addReminder,
    updateReminder: reminderActions.updateReminder,
    deleteReminder: reminderActions.deleteReminder,

    // User actions
    getUsers: userActions.getUsers,
    createUser: userActions.createUser,
    updateUser: userActions.updateUser,
    deleteUser: userActions.deleteUser,

    // Log actions
    getHabitLogs: logActions.getHabitLogs,
    addHabitLog: logActions.addHabitLog,
    deleteHabitLog: logActions.deleteHabitLog,

    // Checklist actions
    viewTodayChecklist: checklistActions.viewTodayChecklist,
    updateTodayHabitStatus: checklistActions.updateTodayHabitStatus,
    cleanupOldTodayStatuses: checklistActions.cleanupOldTodayStatuses,
    viewHabitStreak: checklistActions.viewHabitStreak,
    viewAllStreaks: checklistActions.viewAllStreaks,
    viewHabitStats: checklistActions.viewHabitStats,
  };
}

/**
 * Re-export auth token utilities for backward compatibility
 */
export { createAuthActions };
