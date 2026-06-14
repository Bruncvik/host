# Habits Manager

A full-stack habits tracking application with Node.js/Express backend, PostgreSQL database, and interactive CLI client. Features JWT authentication, per-user data ownership, comprehensive input validation, rate limiting, and a complete integration test suite.

## Key Features

- **User Authentication**: JWT-based login/register with password hashing
- **Per-User Data Ownership**: Users only access their own habits, categories, reminders
- **Habit Management**: Create, read, update, delete habits with frequency tracking
- **Categories & Organization**: Group habits into categories with linking
- **Daily Tracking**: Log daily habit status (done/skipped/pending/missed) with streaks
- **Reminders**: Set time-based reminders for habits (HH:MM format)
- **Admin Interface**: Admin menu for system management (cleanup, user viewing)
- **CLI Interface**: Interactive menu-driven console client with persistent submenus
- **Security**: Input validation, rate limiting (100 req/15min per IP), request size limits (10KB)
- **Testing**: 35+ integration tests covering auth, CRUD, ownership, validation
- **Role-Based Access**: Admin and user roles with different menu options

## Installation

1. **Navigate to the project:**
```bash
cd dvop-zp-2025-2026-filo
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file** with required variables:
```
# PostgreSQL Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=habits_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=4444
```

**Default values:** If not set, JWT_SECRET defaults to `"dev-secret"` and PORT to `4444`.

4. **Initialize database:**
```bash
npx tsx create_table.js
```
Creates all tables: `users`, `habits`, `categories`, `reminders`, `habitlog`, `habitdaystatus`, `habitcategory`.

## Running the Project

### Start the Server

```bash
npx tsx server/server.js
```
- Listens on port 4444 (configurable via `PORT` env var)
- Serves API endpoints at `http://localhost:4444/`

### Run the CLI Client

In another terminal:
```bash
npx tsx client.js
```
- Interactive menu-driven interface
- Requires login (register new account or use existing credentials)
- Different menus for admin vs regular users

## Project Structure

```
.
├── server/
│   ├── server.js              # Express app initialization
│   ├── constants.js           # Shared validation rules and config
│   ├── app.js                 # Route mounting and middleware setup
│   ├── middleware/
│   │   └── requestLimits.js   # Rate limiting and request size validation
│   ├── routes/
│   │   ├── users.js           # POST /register, POST /login
│   │   ├── habits.js          # CRUD for habits
│   │   ├── categories.js      # CRUD for categories
│   │   ├── habitCategories.js # Link/unlink habits to categories
│   │   ├── reminders.js       # CRUD for reminders
│   │   ├── habitLogs.js       # Habit completion logs
│   │   └── habitDayStatus.js  # Daily habit status tracking
│   ├── utils/
│   │   └── validators.js      # Input validation functions
│   └── db.js                  # PostgreSQL connection pool
├── cli/
│   ├── client.js              # CLI entry point
│   ├── menus.js               # Menu system (admin, user, submenus)
│   └── actions.js             # API interaction logic
├── tests/
│   ├── integration.test.js    # 35+ integration tests
│   └── run-integration-tests.js # Test runner with server auto-start
├── create_table.js            # Database schema initialization
├── .env                       # Configuration (git-ignored)
├── package.json               # Dependencies and scripts
└── README.md
```

## Authentication & Security

### JWT Authentication
- **Token Expiry**: 7 days
- **Format**: Bearer token in `Authorization` header
- **Example**: `Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`
- **Storage**: Stored in client's `.env` file or memory during session

### User Registration & Login
- **Password Requirements**:
  - Minimum: 1 character
  - Maximum: 24 characters
- **Password Hashing**: bcryptjs with 10 salt rounds
- **Email Format**: RFC compliant (user@domain.com)

### Security Measures
1. **Input Validation**: All user inputs validated before processing
2. **Rate Limiting**: 100 requests per 15-minute window per IP (returns 429)
3. **Request Size Limit**: 10KB max body size (returns 413)
4. **SQL Injection Prevention**: Parameterized queries via pg driver
5. **XSS Prevention**: No unsafe HTML rendering
6. **Per-User Ownership**: All endpoints verify userid matches requesting user

## Validation Rules

| Field | Min | Max | Format |
|-------|-----|-----|--------|
| **Email** | - | - | user@domain.com |
| **Password** | 1 | 24 | Any characters |
| **Habit Name** | 2 | 80 | Alphanumeric + spaces |
| **Habit Frequency** | 2 | 30 | Text (e.g., "daily", "3x week") |
| **Category Name** | 2 | 50 | Alphanumeric + spaces |
| **Reminder Time** | - | - | HH:MM (24-hour format) |
| **Habit Day Status** | - | - | "pending", "done", "skipped", "missed" |

## CLI Features

### Login & Registration
1. Launch CLI with `npx tsx client.js`
2. Choose "Register" or "Login"
3. Enter email and password
4. Two menu options appear:
   - **Admin Menu**: System management (if role = "admin")
   - **Basic User Menu**: Habit tracking (if role = "user")

### Admin Menu
```
- View Users          # List all users
- Manage Habits       # CRUD for any habit (admin access)
- Manage Categories   # CRUD for any category (admin access)
- Manage Reminders    # CRUD for any reminder (admin access)
- Habit Logs          # View all logs
- Today's Checklist   # View all today's habits (with cleanup option)
- Logout
```

### Basic User Menu (Persistent Submenus)
```
- My Habits
  ├─ Create Habit         # Prompts: name → frequency → category (opt) → reminder (opt)
  ├─ View Habits          # Display all user's habits
  ├─ Update Habit         # Modify habit details
  └─ Delete Habit

- Habit Categories
  ├─ Create Category      # Enter category name
  ├─ View Categories      # List all categories
  ├─ Update Category
  ├─ Delete Category
  └─ Link/Unlink Habits

- Today Checklist
  ├─ View Today's Habits  # Show status for today
  └─ Log Habit Status     # Mark habit as done/skipped/missed

- Logout
```

**Note:** All submenus persist after actions (you remain in the submenu until choosing "back").

## Testing

### Run All Tests
```bash
npm run test:full
```
- Auto-starts server on port 4444
- Runs 35+ integration tests
- Auto-kills server after tests complete
- Returns exit code indicating pass/fail

### Test Coverage
- ✅ Authentication (register, login, token validation)
- ✅ CRUD operations (habits, categories, reminders)
- ✅ Per-user ownership (users cannot access others' data)
- ✅ Input validation (email, password, habit name, frequency)
- ✅ Rate limiting (100 req/15min per IP)
- ✅ Request size limits (10KB max)
- ✅ Habit streaks and statistics
- ✅ Daily status tracking
- ✅ Habit-category relationships
- ✅ Error handling (404, 400, 401, 403, 429, 413)

### Test Files
```
tests/
├── integration.test.js          # All 35 test cases
└── run-integration-tests.js     # Test runner (server auto-start)
```

## Development Notes

### Environment Variables Priority
1. `.env` file (highest priority)
2. Environment variables
3. Defaults (JWT_SECRET = "dev-secret", PORT = 4444)

### Database Connection
- Uses pg library with connection pooling
- Connection string: `postgres://user:password@host:port/dbname`
- All queries use parameterized statements to prevent SQL injection

### Adding New Routes
1. Create route file in `server/routes/`
2. Add middleware/validation as needed
3. Mount route in `server/app.js` (specific routes before generic routes)
4. Add corresponding test cases in `tests/integration.test.js`

### CLI Menu Navigation
- All submenus use `while(true)` loop with `continue` for persistence
- Use `break;` to stay in menu, `return;` to exit to parent menu
- Menu system in `cli/menus.js` handles routing between admin and user views

## Status

- ✅ Core authentication and authorization
- ✅ Database schema with all relationships
- ✅ Full CRUD API endpoints
- ✅ Input validation and security measures
- ✅ CLI interface with persistent menus
- ✅ Integration test suite (35+ tests)
- ⚠️ Some test failures requiring investigation (validation, rate limiting edge cases)

---

**Last Updated:** May 2026
**Version:** 1.1.0