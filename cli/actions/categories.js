import inquirer from "inquirer";

export function createCategoryActions(api) {
  async function getCategories() {
    const response = await api.get("/categories");
    console.log("\nAll Categories\n");
    if (response.data.length === 0) {
      console.log("No categories found.");
      return;
    }
    response.data.forEach((category, index) => {
      console.log(`${index + 1}. [${category.id}] ${category.name}`);
    });
  }

  async function createCategory() {
    const { name } = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Category name:",
        validate: (input) => input.trim().length > 0 || "Name cannot be empty",
      },
    ]);
    await api.post("/categories", { name });
    console.log(" Category created");
  }

  async function updateCategory() {
    const { id } = await inquirer.prompt([
      { type: "input", name: "id", message: "Category ID to update:" },
    ]);

    const { name } = await inquirer.prompt([
      { type: "input", name: "name", message: "New name:" },
    ]);

    if (!name) {
      console.log("Name cannot be empty");
      return;
    }

    await api.put(`/categories/${id}`, { name });
    console.log(" Category updated");
  }

  async function deleteCategory() {
    const { id } = await inquirer.prompt([
      { type: "input", name: "id", message: "Category ID to delete:" },
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

    await api.delete(`/categories/${id}`);
    console.log(" Category deleted");
  }

  async function getHabitCategories() {
    const { habitId } = await inquirer.prompt([
      { type: "input", name: "habitId", message: "Habit ID:" },
    ]);

    const response = await api.get(`/habits/${habitId}/categories`);
    console.log("\nCategories for Habit " + habitId + "\n");
    if (response.data.length === 0) {
      console.log("No categories linked.");
      return;
    }
    response.data.forEach((category, index) => {
      console.log(`${index + 1}. [${category.id}] ${category.name}`);
    });
  }

  async function linkCategoryToHabit() {
    const { habitId, categoryId } = await inquirer.prompt([
      { type: "input", name: "habitId", message: "Habit ID:" },
      { type: "input", name: "categoryId", message: "Category ID to link:" },
    ]);

    await api.post(`/habits/${habitId}/categories`, { categoryId });
    console.log(" Category linked to habit");
  }

  async function unlinkCategoryFromHabit() {
    const { habitId, categoryId } = await inquirer.prompt([
      { type: "input", name: "habitId", message: "Habit ID:" },
      { type: "input", name: "categoryId", message: "Category ID to unlink:" },
    ]);

    await api.delete(`/habits/${habitId}/categories/${categoryId}`);
    console.log(" Category unlinked from habit");
  }

  return {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getHabitCategories,
    linkCategoryToHabit,
    unlinkCategoryFromHabit,
  };
}
