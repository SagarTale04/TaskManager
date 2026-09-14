You are working on my existing full-stack project called SyncSprint.

IMPORTANT:
Do not redesign the project or introduce unnecessary abstractions.
Do not rewrite working code unless there is a clear bug or cleanup benefit.
Follow the existing architecture and naming conventions exactly.

Current backend stack:
- Node.js
- Express.js 5
- PostgreSQL
- Sequelize 6
- ES Modules
- JWT authentication
- bcrypt
- Sequelize CLI migrations and seeders

Backend architecture already used:

Route
→ Middleware
→ Controller
→ Service
→ Sequelize Model
→ PostgreSQL

Existing folders:

Backend/src/
  config/
  migrations/
  seeders/
  models/
  controllers/
  services/
  middleware/
  routes/
  utils/
  app.js
  server.js

IMPORTANT:
The middleware folder is named exactly:

src/middleware/

not "middlewares".

Local ES module imports must include .js.

Existing entities:

User
Team
TeamMember
Project
Sprint
Task
Comment

Database hierarchy:

User
  ↓ membership
Team
  ↓
Project
  ↓
Sprint
  ↓
Task
  ↓
Comment

Existing global roles:

SUPER_ADMIN
ADMIN
DEVELOPER

Existing team roles:

OWNER
ADMIN
MEMBER

Global role is stored in users.role.
Team-specific role is stored in team_members.role.

Existing authorization philosophy:

- protect middleware authenticates JWT and sets req.user
- authorize(...) handles global roles
- team membership / team roles decide access to team-owned resources
- Project belongs to Team
- Sprint belongs to Project
- Task belongs to Project and optionally Sprint
- Comment belongs to Task

Already implemented and working:

AUTH
- register
- login
- get logged-in user
- JWT authentication
- password hashing

TEAM
- create team
- get my teams
- add team member
- update member role
- remove member

PROJECT
- create project
- list team projects
- get project by id
- update project
- archive project

Project archive is implemented by setting:

status = "ARCHIVED"

instead of permanently deleting the row.

SPRINT already implemented:
- create sprint
- list project sprints
- get sprint by id
- update sprint

Sprint access works by:

sprintId
→ Sprint.projectId
→ Project.teamId
→ TeamMember
→ check logged-in user

For writes, OWNER / ADMIN are generally allowed.
For reads, OWNER / ADMIN / MEMBER are generally allowed.

TASK:
Complete the remaining backend cleanly.

Before changing anything:
1. Inspect all existing migrations.
2. Inspect models.
3. Inspect associations in models/index.js.
4. Inspect routes, controllers and services.
5. Treat the migrations / actual DB schema as the source of truth.
6. Do not invent fields, enum values, relationships, routes or permissions that conflict with the current schema.

TASK 1 — Finish Sprint module

Inspect the Sprint migration/model first.

If the Sprint status enum already supports a reasonable non-destructive terminal state such as COMPLETED, use that.

Do NOT add ARCHIVED to the database enum unless a migration would genuinely be required.

Complete any missing Sprint endpoint cleanly.

Avoid hard deleting sprints if doing so would unnecessarily destroy related tasks.

TASK 2 — Complete Task module

Implement clean REST APIs for the existing Task schema.

Use the current migration/model field names exactly.

Likely task functionality should include, where supported by the schema:

- create task
- list tasks for a project and/or sprint
- get task by id
- update task
- update task status
- assign / reassign task
- priority
- story points
- due date
- delete/archive only if appropriate for the existing schema

Do not invent features if the schema does not support them.

Important access rule:

To authorize access to a task, trace:

Task
→ Project
→ Team
→ TeamMember

If a task has sprintId, do not assume Sprint is the source of team ownership if Project already provides it.

Read operations:
any member of the project's team may generally read.

Write operations:
use sensible OWNER / ADMIN permissions based on the existing application design.

For task assignment:
verify the assignee exists and belongs to the project's team before assigning the task.

Do not allow assignment to arbitrary users outside the team.

TASK 3 — Complete Comment module

Implement REST APIs appropriate to the existing Comment schema.

Likely:
- create comment on task
- list comments for task
- update own comment
- delete own comment

Admins/owners may be allowed broader moderation only if consistent with the existing authorization design.

For comment access trace:

Comment
→ Task
→ Project
→ Team
→ TeamMember

A user must be a member of the task's team to interact with comments.

Do not invent unsupported fields.

TASK 4 — Reduce repeated authorization logic

There is repeated logic such as:

Project
→ teamId
→ TeamMember

and:

Sprint
→ Project
→ teamId
→ TeamMember

and:

Task
→ Project
→ teamId
→ TeamMember

Clean this up only if it significantly improves readability.

Prefer small reusable helpers/services such as:

getProjectMembership(...)
getSprintWithAccess(...)
getTaskWithAccess(...)

or equivalent.

Do NOT create a large over-engineered permission framework.

Keep the existing route-controller-service-model architecture.

Services must not use req or res.

Controllers should remain responsible for HTTP request/response concerns.

TASK 5 — Validation and error handling

Improve validation where useful.

Validate things such as:

- required fields
- valid enum values
- valid IDs
- date ordering
- duplicate membership where relevant
- project/sprint/task existence
- authorized team membership
- assignment only to users in the team

Keep error responses consistent:

{
  "success": false,
  "message": "..."
}

Successful responses should use the existing shape:

{
  "success": true,
  "message": "...",
  "data": { ... }
}

Do not add a validation library unless genuinely necessary.

TASK 6 — Clean code

Review backend code for:

- duplicate imports
- unused imports
- inconsistent formatting
- incorrect field names
- incorrect Sequelize aliases
- incorrect routes
- missing .js extensions
- inconsistent error status codes
- unnecessary comments
- duplicate business logic
- accidental temporary/debug code
- obsolete test/practice files if clearly unused

Do not remove anything unless it is clearly safe.

Preserve existing migrations and seed data unless there is an actual schema bug.

Do not use sequelize.sync() because migrations manage the database schema.

TASK 7 — Route organization

Keep nested collection routes with their parent resource.

Examples:

POST /api/teams/:teamId/projects
GET  /api/teams/:teamId/projects

POST /api/projects/:projectId/sprints
GET  /api/projects/:projectId/sprints

Task collection routes may similarly live under project/sprint routes where appropriate.

Individual resource routes should use:

/api/projects/:projectId
/api/sprints/:sprintId
/api/tasks/:taskId
/api/comments/:commentId

Keep route files clean and resource-oriented.

TASK 8 — Test manually

After implementation, run the backend and test all important endpoints.

Test at least:

1. Successful authenticated access
2. Missing JWT
3. Invalid JWT
4. User outside team
5. MEMBER attempting admin-only write
6. OWNER / ADMIN successful write
7. Missing resource
8. Invalid enum/status
9. Invalid date range
10. Assigning task to a user outside the team
11. Comment author editing their own comment
12. Unauthorized user attempting comment modification

Do not silently ignore errors.

TASK 9 — STOP RULE

This is extremely important.

Complete anything that is simply a repetition or extension of concepts already present:
- CRUD
- Express routes
- controllers
- services
- Sequelize queries
- existing-style authorization
- validation
- refactoring repeated access checks
- testing existing APIs

BUT STOP and explain to me before implementing anything that introduces a genuinely new backend concept I have not yet learned.

Examples of things you MUST stop before implementing:

- transactions beyond patterns already used
- database indexing/performance optimization
- pagination strategy
- Redis/caching
- queues/background jobs
- WebSockets
- rate limiting
- refresh-token architecture
- email verification/password reset
- file uploads
- object storage
- logging infrastructure
- automated Jest/Supertest testing architecture
- OpenAPI/Swagger
- Docker/backend deployment
- CI/CD
- database locking
- advanced security architecture
- centralized error middleware if it meaningfully changes the current architecture
- new database migrations/schema design
- anything else that introduces a substantial new concept

When you encounter one of these, STOP.

Do not implement it.

Instead output:

NEW CONCEPT REACHED

Concept:
<name>

Why it is useful:
<short explanation>

What problem it solves in SyncSprint:
<short explanation>

Files that would likely change:
<files>

Then wait for me to implement/learn it manually.

TASK 10 — Final report

When all remaining work that does NOT require a new concept is complete, give me:

1. Files created
2. Files modified
3. Routes implemented
4. Permissions used
5. Bugs fixed
6. Any assumptions made
7. Anything intentionally left unfinished
8. Any NEW CONCEPTS you stopped before implementing
9. Exact Postman/Thunder Client endpoints I should test
10. A recommended Git commit message

Do not touch the Next.js frontend yet.

Focus only on completing and cleaning the current backend.