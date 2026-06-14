import inquirer from "inquirer";
import { normalizeRole } from "../common.js";
import { validateEmail, validatePassword } from "../../server/utils/validators.js";

export function createAuthActions(api) {
  function setApiAuthToken(token) {
    if (!api.defaults.headers.common) {
      api.defaults.headers.common = {};
    }
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  function clearApiAuthToken() {
    if (api.defaults.headers.common) {
      delete api.defaults.headers.common.Authorization;
    }
  }

  async function registerFlow() {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: "Email:",
        validate: (input) => {
          const err = validateEmail(input);
          return err === null ? true : err;
        },
        filter: (input) => String(input || "").trim().toLowerCase(),
      },
      {
        type: "password",
        name: "password",
        message: "Password:",
        mask: "*",
        validate: (input) => {
          const err = validatePassword(input);
          return err === null ? true : err;
        },
      },
    ]);

    await api.post("/users", {
      email: answers.email,
      password: answers.password,
      role: "user",
    });

    console.log(" Registration successful. You can now login.");
  }

  async function loginFlow() {
    const answers = await inquirer.prompt([
      { type: "input", name: "email", message: "Email:", validate: (input) => input.trim().length > 0 || "Email cannot be empty" },
      { type: "password", name: "password", message: "Password:", mask: "*", validate: (input) => input.trim().length > 0 || "Password cannot be empty" },
    ]);

    try {
      const response = await api.post("/auth/login", {
        email: answers.email,
        password: answers.password,
      });
      const loggedInUser = response.data;
      const role = normalizeRole(loggedInUser.role);
      if (loggedInUser.token) {
        setApiAuthToken(loggedInUser.token);
      }
      console.log(` Logged in as ${loggedInUser.email} (${role})`);
      return {
        id: loggedInUser.id,
        email: loggedInUser.email,
        role,
        token: loggedInUser.token || null,
      };
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(" Invalid credentials");
        return null;
      }
      throw error;
    }
  }

  return {
    setApiAuthToken,
    clearApiAuthToken,
    registerFlow,
    loginFlow,
  };
}
