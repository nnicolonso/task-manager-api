# Task Manager API

A REST API for managing tasks, built with Node.js, Express, and PostgreSQL. Includes JWT authentication, input validation, and a full smoke test suite.

**Live URL:** `https://<your-railway-url>.up.railway.app`

---

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js |
| Framework | Express v5 |
| Database | PostgreSQL (Railway) |
| Auth | JWT (jsonwebtoken + bcrypt) |
| Validation | Zod |
| Testing | Jest + Supertest |

---

## Architecture

```
server.js               ← entry point, loads env, starts HTTP server
src/
  app.js                ← Express app, mounts routes
  db/
    database.js         ← pg connection pool, table creation
  routes/
    auth.js             ← POST /api/auth/register, /login
    tasks.js            ← CRUD /api/tasks (protected)
  controllers/
    authController.js   ← register, login logic
    taskController.js   ← getAllTasks, getTaskById, createTask, updateTask, deleteTask
  middleware/
    auth.js             ← verifies Bearer JWT token
    validate.js         ← generic Zod schema validator
  schemas/
    auth.js             ← registerSchema, loginSchema
    tasks.js            ← createTaskSchema, updateTaskSchema
tests/
  smoke.test.js         ← 16 integration tests against live DB
```

**Request flow:**

```
Client → Express → auth middleware → validate middleware → controller → PostgreSQL
```

---

## Local Setup

```bash
git clone https://github.com/nnicolonso/task-manager-api
cd task-manager-api
npm install
```

Create a `.env` file:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
```

```bash
npm run dev     # development with nodemon
npm start       # production
npm test        # run smoke tests
```

---

## API Reference

All task routes require the header:
```
Authorization: Bearer <token>
```

### Auth

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{ "email": "you@example.com", "password": "yourpassword" }
```
Response `201`:
```json
{
  "user": { "id": 1, "email": "you@example.com", "created_at": "..." },
  "token": "<jwt>"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{ "email": "you@example.com", "password": "yourpassword" }
```
Response `200`:
```json
{ "token": "<jwt>" }
```

---

### Tasks

#### Get all tasks
```bash
GET /api/tasks
GET /api/tasks?status=pending
```
Response `200`: array of task objects

#### Get task by ID
```bash
GET /api/tasks/:id
```
Response `200`:
```json
{
  "id": 1,
  "title": "My task",
  "description": "Some details",
  "status": "pending",
  "created_at": "...",
  "updated_at": "..."
}
```

#### Create task
```bash
POST /api/tasks
Content-Type: application/json

{ "title": "My task", "description": "Optional", "status": "pending" }
```
- `title` — required, max 255 chars
- `description` — optional, max 1000 chars
- `status` — optional, one of `pending` `in_progress` `done` (default: `pending`)

Response `201`: task object

#### Update task
```bash
PUT /api/tasks/:id
Content-Type: application/json

{ "status": "done" }
```
At least one field required. All fields optional.

Response `200`: updated task object

#### Delete task
```bash
DELETE /api/tasks/:id
```
Response `204`: no body

---

### Error responses

| Status | Meaning |
|---|---|
| 400 | Validation failed — body contains `{ errors: [{ field, message }] }` |
| 401 | Missing or invalid JWT |
| 404 | Resource not found |
| 409 | Email already registered |
| 500 | Server error |

---

## Database Schema

```sql
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,          -- bcrypt hash
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tasks (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'pending', -- pending | in_progress | done
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

---

## Tests

```bash
npm test
```

16 integration tests covering auth and all task routes — register, login, create, read, update, delete, plus error cases (401, 404, 400 validation). Tests run against the real PostgreSQL database and clean up after themselves.

```
Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
```
