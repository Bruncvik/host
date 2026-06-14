import inquirer from "inquirer";

export function createHabitActions(api) {
  async function getHabits() {
    const response = await api.get("/habits");
    console.log("\nAll Habits\n");
    if (response.data.length === 0) {
      console.log("No habits found.");
      return;
    }

    const habitsWithDetails = await Promise.all(
      response.data.map(async (habit) => {
        const remindersResponse = await api.get(`/habits/${habit.id}/reminders`);
        const categoriesResponse = await api.get(`/habits/${habit.id}/categories`);
        return {
          ...habit,
          reminders: remindersResponse.data || [],
          categories: categoriesResponse.data || [],
        };
      })
    );

    habitsWithDetails.forEach((habit, index) => {
      const categoryText =
        habit.categories.length > 0
          ? habit.categories.map((category) => category.name).join(", ")
          : "none";
      const reminderText =
        habit.reminders.length > 0
          ? habit.reminders.map((reminder) => reminder.time).join(", ")
          : "none";
      console.log(
        `${index + 1}. [${habit.id}] ${habit.name} (${habit.frequency}) - category: ${categoryText} - reminder: ${reminderText}`
      );
    });
  }

  async function createHabit(currentUser) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Habit name:",
        validate: (input) => input.trim().length > 0 || "Name cannot be empty",
      },
      {
        type: "input",
        name: "frequency",
        message: "Frequency (daily, weekly, etc.):",
      },
    ]);

    const categoryResponse = await api.get("/categories");
    const categories = categoryResponse.data || [];
    let categoryId = null;

    if (categories.length > 0) {
      const categoryChoices = categories.map((category) => ({
        name: `${category.name} [${category.id}]`,
        value: category.id,
      }));
      categoryChoices.unshift({ name: "None", value: null });
      const { chosen } = await inquirer.prompt([
        {
          type: "list",
          name: "chosen",
          message: `Choose a category (insert only ID): Available: ${categories.map((category) => `${category.name} [${category.id}]`).join(", ")}`,
          choices: categoryChoices,
        },
      ]);
      categoryId = chosen;
    } else {
      console.log("No categories available. You can add categories from the Categories menu.");
    }

    const { reminderTime } = await inquirer.prompt([
      { type: "input", name: "reminderTime", message: "Reminder time (HH:MM or leave empty):" },
    ]);

    const createResponse = await api.post("/habits", {
      name: answers.name,
      frequency: answers.frequency,
      created_at: new Date().toISOString(),
      userId: currentUser?.id || null,
    });
    const habit = createResponse.data;

    if (categoryId) {
      await api.post(`/habits/${habit.id}/categories`, { categoryId });
      console.log(" Category linked");
    }

    if (reminderTime && reminderTime.trim() !== "") {
      await api.post(`/habits/${habit.id}/reminders`, { time: reminderTime.trim() });
      console.log(" Reminder created");
    }

    console.log(" Habit created");
  }

  async function updateHabit() {
    const { id } = await inquirer.prompt([
      { type: "input", name: "id", message: "Habit ID to update:" },
    ]);

    const updates = await inquirer.prompt([
      { type: "input", name: "name", message: "New name (leave empty to skip):" },
      { type: "input", name: "frequency", message: "New frequency (leave empty to skip):" },
    ]);

    let categoryId = null;
    let shouldUpdateCategory = false;
    try {
      const currentCategoriesResponse = await api.get(`/habits/${id}/categories`);
      const currentCategories = currentCategoriesResponse.data || [];
      console.log(
        currentCategories.length > 0
          ? `Current categories: ${currentCategories.map((category) => `${category.name} [${category.id}]`).join(", ")}`
          : "Current categories: none"
      );

      const { updateCategory } = await inquirer.prompt([
        {
          type: "confirm",
          name: "updateCategory",
          message: "Update category too?",
          default: false,
        },
      ]);
      shouldUpdateCategory = updateCategory;

      if (shouldUpdateCategory) {
        const categoryResponse = await api.get("/categories");
        const categories = categoryResponse.data || [];

        if (categories.length > 0) {
          const categoryChoices = categories.map((category) => ({
            name: `${category.name} [${category.id}]`,
            value: category.id,
          }));
          categoryChoices.unshift({ name: "None", value: null });

          const { chosen } = await inquirer.prompt([
            {
              type: "list",
              name: "chosen",
              message: `Choose the new category (or None): Available: ${categories.map((category) => `${category.name} [${category.id}]`).join(", ")}`,
              choices: categoryChoices,
            },
          ]);

          categoryId = chosen;
        } else {
          console.log("No categories available. Category will remain unchanged.");
          shouldUpdateCategory = false;
        }
      }
    } catch (error) {
      console.log(`Could not load categories for this habit: ${error.message}`);
    }

    const updateData = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.frequency) updateData.frequency = updates.frequency;

    if (Object.keys(updateData).length === 0 && !shouldUpdateCategory) {
      console.log("No fields to update");
      return;
    }

    if (Object.keys(updateData).length > 0) {
      await api.put(`/habits/${id}`, updateData);
    }

    if (shouldUpdateCategory) {
      const currentCategoriesResponse = await api.get(`/habits/${id}/categories`);
      const currentCategories = currentCategoriesResponse.data || [];

      for (const category of currentCategories) {
        await api.delete(`/habits/${id}/categories/${category.id}`);
      }

      if (categoryId) {
        await api.post(`/habits/${id}/categories`, { categoryId });
        console.log(" Category updated");
      } else {
        console.log(" Category cleared");
      }
    }

    console.log(" Habit updated");
  }

  async function deleteHabit() {
    const habitsResponse = await api.get("/habits");
    const habits = habitsResponse.data || [];

    console.log("\nAvailable Habits (for delete)\n");
    if (habits.length === 0) {
      console.log("No habits found.");
      return;
    }

    habits.forEach((habit, index) => {
      console.log(`${index + 1}. [${habit.id}] ${habit.name} (${habit.frequency})`);
    });

    const { id } = await inquirer.prompt([
      { type: "input", name: "id", message: "Habit ID to delete:" },
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

    await api.delete(`/habits/${id}`);
    console.log(" Habit deleted");
  }

  return {
    getHabits,
    createHabit,
    updateHabit,
    deleteHabit,
  };
}
