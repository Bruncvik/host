import inquirer from "inquirer";
import { normalizeRole } from "../common.js";
import { validateEmail, validatePassword } from "../../server/utils/validators.js";

export function createUserActions(api) {
  function validationMessage(result) {
    return result.isValid ? true : result.error;
  }

  async function getUsers() {
    const response = await api.get("/users");
    console.log("\nAll Users\n");
    if (response.data.length === 0) {
      console.log("No users found.");
      return;
    }
    response.data.forEach((user, index) => {
      console.log(`${index + 1}. [${user.id}] ${user.email} (${normalizeRole(user.role)})`);
    });
  }

  async function createUser() {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: "Email:",
        validate: (input) => {
          return validationMessage(validateEmail(input));
        },
        filter: (input) => String(input || "").trim().toLowerCase(),
      },
      {
        type: "password",
        name: "password",
        message: "Password:",
        mask: "*",
        validate: (input) => {
          return validationMessage(validatePassword(input));
        },
      },
      {
        type: "list",
        name: "role",
        message: "Role:",
        choices: [
          { name: "Basic user", value: "user" },
          { name: "Admin", value: "admin" },
        ],
        default: "user",
      },
    ]);

    await api.post("/users", {
      email: answers.email,
      password: answers.password,
      role: answers.role,
    });
    console.log(" User created");
  }

  async function updateUser() {
    const { id } = await inquirer.prompt([
      { type: "input", name: "id", message: "User ID to update:" },
    ]);

    const updates = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: "New email (leave empty to skip):",
        validate: (input) => {
          const value = String(input || "").trim();
          if (!value) return true;
          return validationMessage(validateEmail(value));
        },
        filter: (input) => String(input || "").trim().toLowerCase(),
      },
      {
        type: "password",
        name: "password",
        message: "New password (leave empty to skip):",
        mask: "*",
        validate: (input) => {
          if (!input) return true;
          return validationMessage(validatePassword(input));
        },
      },
      {
        type: "list",
        name: "role",
        message: "New role (leave unchanged):",
        choices: [
          { name: "Leave unchanged", value: "" },
          { name: "Basic user", value: "user" },
          { name: "Admin", value: "admin" },
        ],
        default: "",
      },
    ]);

    const updateData = {};
    if (updates.email) updateData.email = updates.email;
    if (updates.password) updateData.password = updates.password;
    if (updates.role) updateData.role = updates.role;

    if (Object.keys(updateData).length === 0) {
      console.log("No fields to update");
      return;
    }

    await api.put(`/users/${id}`, updateData);
    console.log(" User updated");
  }

  async function deleteUser() {
    const { id } = await inquirer.prompt([
      { type: "input", name: "id", message: "User ID to delete:" },
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

    await api.delete(`/users/${id}`);
    console.log(" User deleted");
  }

  return {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}
