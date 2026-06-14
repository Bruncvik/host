export function normalizeRole(role) {
  return role === "admin" ? "admin" : "user";
}

export function showActions(title, actions) {
  console.log(`\n=== ${title} ===`);
  actions.forEach((action, index) => {
    if (typeof action === "string") {
      console.log(`${index + 1}. ${action}`);
      return;
    }
    console.log(`${index + 1}. ${action.label} (${action.command})`);
  });
  console.log("Use arrow keys and Enter to choose.\n");
}
