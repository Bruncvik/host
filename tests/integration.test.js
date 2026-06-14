import axios from "axios";
import assert from "assert";

const BASE_URL = "http://localhost:4444";

let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
};

function log(message, type = "info") {
  const prefix = type === "error" ? "❌" : type === "success" ? "✅" : "ℹ️";
  console.log(`${prefix} ${message}`);
}

async function test(description, fn) {
  try {
    await fn();
    testResults.passed++;
    log(description, "success");
  } catch (error) {
    testResults.failed++;
    let errorMsg = error.message;
    // Provide better error messages for axios errors
    if (error.response) {
      errorMsg = `Status ${error.response.status}: ${error.response.data?.message || error.message}`;
    } else if (error.code === "ECONNREFUSED") {
      errorMsg = "Connection refused - server not running";
    }
    testResults.errors.push({ description, error: errorMsg });
    log(`${description}: ${errorMsg}`, "error");
  }
}

// Test data
let testUser = {
  email: `test-${Date.now()}@example.com`,
  password: "TestPassword123",
};

let authToken = null;
let habitId = null;
let categoryId = null;
const testTimestamp = Date.now(); // Unique identifier for this test run
let reminderId = null;

console.log("\n📋 Starting Integration Tests\n");
console.log("═".repeat(50));

// ============================================================================
// 1. AUTHENTICATION TESTS
// ============================================================================
console.log("\n🔐 AUTHENTICATION TESTS\n");

await test("Register new user", async () => {
  const response = await axios.post(`${BASE_URL}/users`, {
    email: testUser.email,
    password: testUser.password,
  });
  assert.strictEqual(response.status, 201);
  assert(response.data.id);
  assert(response.data.email);
});

await test("Login and receive JWT token", async () => {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email: testUser.email,
    password: testUser.password,
  });
  assert.strictEqual(response.status, 200);
  assert(response.data.token);
  authToken = response.data.token;
});

await test("Reject login with invalid credentials", async () => {
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: "WrongPassword",
    });
    throw new Error("Should have failed");
  } catch (error) {
    assert.strictEqual(error.response.status, 401);
  }
});

await test("Reject request without authorization header", async () => {
  try {
    await axios.get(`${BASE_URL}/habits`);
    throw new Error("Should have failed");
  } catch (error) {
    assert.strictEqual(error.response.status, 401);
  }
});

// ============================================================================
// 2. HABIT CRUD TESTS
// ============================================================================
console.log("\n📝 HABIT MANAGEMENT TESTS\n");

await test("Create a new habit", async () => {
  const response = await axios.post(
    `${BASE_URL}/habits`,
    {
      name: "Morning Exercise",
      frequency: "daily",
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.data.name, "Morning Exercise");
  assert(response.data.id);
  habitId = response.data.id;
});

await test("Get single habit by ID", async () => {
  const response = await axios.get(`${BASE_URL}/habits/${habitId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.id, habitId);
  assert.strictEqual(response.data.name, "Morning Exercise");
});

await test("List all user habits", async () => {
  const response = await axios.get(`${BASE_URL}/habits`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.strictEqual(response.status, 200);
  assert(Array.isArray(response.data));
  assert(response.data.length > 0);
});

await test("Update habit", async () => {
  const response = await axios.put(
    `${BASE_URL}/habits/${habitId}`,
    {
      name: "Morning Exercise (Updated)",
      frequency: "weekdays",
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.name, "Morning Exercise (Updated)");
});

await test("Reject invalid habit ID (non-numeric)", async () => {
  try {
    await axios.get(`${BASE_URL}/habits/abc123`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    throw new Error("Should have failed");
  } catch (error) {
    assert(error.response, `Expected error.response, got: ${error.message}`);
    assert.strictEqual(error.response.status, 400);
    assert(error.response.data.message.includes("positive integer"));
  }
});

// ============================================================================
// 3. CATEGORY TESTS
// ============================================================================
console.log("\n🏷️  CATEGORY MANAGEMENT TESTS\n");

await test("Create a category", async () => {
  const response = await axios.post(
    `${BASE_URL}/categories`,
    {
      name: `Health & Fitness ${testTimestamp}`,
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.data.name, `Health & Fitness ${testTimestamp}`);
  assert(response.data.id);
  categoryId = response.data.id;
});

await test("Reject category with too-short name", async () => {
  try {
    await axios.post(
      `${BASE_URL}/categories`,
      {
        name: "A",
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    throw new Error("Should have failed");
  } catch (error) {
    assert(error.response, `Expected error.response, got: ${error.message}`);
    assert.strictEqual(error.response.status, 400);
    assert(error.response.data.message.includes("at least 2"));
  }
});

await test("Reject category with too-long name", async () => {
  try {
    await axios.post(
      `${BASE_URL}/categories`,
      {
        name: "A".repeat(51),
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    throw new Error("Should have failed");
  } catch (error) {
    assert(error.response, `Expected error.response, got: ${error.message}`);
    assert.strictEqual(error.response.status, 400);
    assert(error.response.data.message.includes("at most 50"));
  }
});

await test("Update category", async () => {
  const response = await axios.put(
    `${BASE_URL}/categories/${categoryId}`,
    {
      name: `Wellness ${testTimestamp}`,
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.name, `Wellness ${testTimestamp}`);
});

// ============================================================================
// 4. HABIT-CATEGORY LINKING TESTS
// ============================================================================
console.log("\n🔗 HABIT-CATEGORY LINKING TESTS\n");

await test("Link habit to category", async () => {
  const response = await axios.post(
    `${BASE_URL}/habits/${habitId}/categories`,
    {
      categoryId: categoryId,
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  assert.strictEqual(response.status, 201);
  assert(response.data.habitid);
  assert(response.data.categoryid);
});

await test("List habit categories", async () => {
  const response = await axios.get(`${BASE_URL}/habits/${habitId}/categories`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.strictEqual(response.status, 200);
  assert(Array.isArray(response.data));
  assert(response.data.length > 0);
});

await test("Reject invalid category ID in link", async () => {
  try {
    await axios.post(
      `${BASE_URL}/habits/${habitId}/categories`,
      {
        categoryId: "xyz",
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    throw new Error("Should have failed");
  } catch (error) {
    assert(error.response, `Expected error.response, got: ${error.message}`);
    assert.strictEqual(error.response.status, 400);
  }
});

// ============================================================================
// 5. REMINDER TESTS
// ============================================================================
console.log("\n🔔 REMINDER TESTS\n");

await test("Add reminder to habit", async () => {
  const response = await axios.post(
    `${BASE_URL}/habits/${habitId}/reminders`,
    {
      time: "07:30",
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.data.time, "07:30");
  assert(response.data.id);
  reminderId = response.data.id;
});

await test("Reject invalid time format", async () => {
  try {
    await axios.post(
      `${BASE_URL}/habits/${habitId}/reminders`,
      {
        time: "25:00",
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    throw new Error("Should have failed");
  } catch (error) {
    assert(error.response, `Expected error.response, got: ${error.message}`);
    assert.strictEqual(error.response.status, 400);
    assert(error.response.data.message.includes("HH:MM"));
  }
});

await test("List reminders for habit", async () => {
  const response = await axios.get(`${BASE_URL}/habits/${habitId}/reminders`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.strictEqual(response.status, 200);
  assert(Array.isArray(response.data));
  assert(response.data.length > 0);
});

await test("Update reminder", async () => {
  const response = await axios.put(
    `${BASE_URL}/reminders/${reminderId}`,
    {
      time: "08:00",
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.time, "08:00");
});

// ============================================================================
// 6. HABIT STATUS & LOGS TESTS
// ============================================================================
console.log("\n✅ HABIT STATUS & LOGS TESTS\n");

await test("Get today's habit status", async () => {
  const response = await axios.get(`${BASE_URL}/habits/${habitId}/today-status`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.strictEqual(response.status, 200);
  assert(response.data.status);
});

await test("Add log entry for habit", async () => {
  const response = await axios.post(
    `${BASE_URL}/habits/${habitId}/logs`,
    {},
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  assert.strictEqual(response.status, 201);
  assert(response.data.id);
});

await test("List habit logs", async () => {
  const response = await axios.get(`${BASE_URL}/habits/${habitId}/logs`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.strictEqual(response.status, 200);
  assert(Array.isArray(response.data));
});

// ============================================================================
// 7. STREAKS & STATS TESTS
// ============================================================================
console.log("\n📊 STREAKS & STATS TESTS\n");

await test("Get habit streak", async () => {
  const response = await axios.get(`${BASE_URL}/habits/${habitId}/streak`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.strictEqual(response.status, 200);
  assert(response.data.habitId);
  assert(typeof response.data.currentStreak === "number");
});

await test("Get habit statistics", async () => {
  const response = await axios.get(`${BASE_URL}/habits/${habitId}/stats`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.strictEqual(response.status, 200);
  assert(response.data.summary);
  assert(typeof response.data.summary.completionRatePct === "number");
});

await test("Get all streaks", async () => {
  const response = await axios.get(`${BASE_URL}/habits/streaks/all`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.strictEqual(response.status, 200);
  assert(Array.isArray(response.data.items));
});

// ============================================================================
// 8. SECURITY & LIMITS TESTS
// ============================================================================
console.log("\n🛡️  SECURITY & LIMITS TESTS\n");

await test("Reject oversized request body", async () => {
  try {
    const largePayload = "x".repeat(11 * 1024); // 11KB, exceeds 10KB limit
    await axios.post(
      `${BASE_URL}/habits`,
      {
        name: largePayload,
        frequency: "daily",
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    throw new Error("Should have failed");
  } catch (error) {
    assert(
      (error.response && error.response.status === 413) || error.code === "ERR_FR_TOO_LARGE",
      `Expected 413 or ERR_FR_TOO_LARGE, got: ${error.response?.status || error.code || error.message}`
    );
  }
});

await test("Rate limit excessive requests (100+ in 15min window)", async () => {
  let hitLimit = false;
  let lastStatus = null;
  for (let i = 0; i < 110; i++) {
    try {
      const response = await axios.get(`${BASE_URL}/habits`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      lastStatus = response.status;
    } catch (error) {
      lastStatus = error.response?.status || error.code;
      if (error.response && error.response.status === 429) {
        hitLimit = true;
        break;
      }
    }
  }
  assert(hitLimit, `Rate limit should trigger after 100 requests, last status: ${lastStatus}`);
  
  // Reset rate limit buckets for subsequent tests
  try {
    await axios.post(`${BASE_URL}/__test__/reset-rate-limits`);
  } catch (error) {
    console.warn("Failed to reset rate limits:", error.message);
  }
});

// ============================================================================
// 9. OWNERSHIP & AUTHORIZATION TESTS
// ============================================================================
console.log("\n🔒 OWNERSHIP & AUTHORIZATION TESTS\n");

let secondUser = {
  email: `test2-${Date.now()}@example.com`,
  password: "TestPassword123",
};

let secondUserToken = null;

await test("Register second user", async () => {
  const response = await axios.post(`${BASE_URL}/users`, {
    email: secondUser.email,
    password: secondUser.password,
  });
  assert.strictEqual(response.status, 201);
});

await test("Second user login", async () => {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email: secondUser.email,
    password: secondUser.password,
  });
  assert.strictEqual(response.status, 200);
  secondUserToken = response.data.token;
});

await test("Second user cannot access first user's habit", async () => {
  try {
    await axios.get(`${BASE_URL}/habits/${habitId}`, {
      headers: { Authorization: `Bearer ${secondUserToken}` },
    });
    throw new Error("Should have failed");
  } catch (error) {
    assert.strictEqual(error.response.status, 403);
  }
});

// ============================================================================
// 10. DELETION TESTS
// ============================================================================
console.log("\n🗑️  DELETION TESTS\n");

await test("Delete reminder", async () => {
  const response = await axios.delete(`${BASE_URL}/reminders/${reminderId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.strictEqual(response.status, 200);
});

await test("Delete habit-category link", async () => {
  const response = await axios.delete(
    `${BASE_URL}/habits/${habitId}/categories/${categoryId}`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  assert.strictEqual(response.status, 200);
});

await test("Delete category", async () => {
  const response = await axios.delete(`${BASE_URL}/categories/${categoryId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.strictEqual(response.status, 200);
});

await test("Delete habit", async () => {
  const response = await axios.delete(`${BASE_URL}/habits/${habitId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert.strictEqual(response.status, 200);
});

// ============================================================================
// TEST RESULTS
// ============================================================================
console.log("\n" + "═".repeat(50));
console.log("\n📈 TEST RESULTS\n");
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📊 Total:  ${testResults.passed + testResults.failed}`);

if (testResults.failed > 0) {
  console.log("\n⚠️  Failed Tests:\n");
  testResults.errors.forEach((err) => {
    console.log(`  • ${err.description}`);
    console.log(`    ${err.error}\n`);
  });
}

console.log("═".repeat(50) + "\n");

process.exit(testResults.failed > 0 ? 1 : 0);
