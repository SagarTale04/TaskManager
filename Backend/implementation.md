Continue working on my SyncSprint backend.

Tech stack:
- Node.js
- Express 5
- PostgreSQL
- Sequelize 6
- sequelize-cli
- ES modules for runtime code
- CommonJS .cjs for migrations

IMPORTANT:
First inspect the existing project, migrations, models, associations, services, and current database schema. Do not assume field names. The existing migrations/database schema are the source of truth.

TASK:
Complete the DATABASE INDEXING / QUERY PERFORMANCE part of the backend.

I do not want unnecessary refactoring or new features. Only add indexes that are justified by the query patterns already used by SyncSprint.

Current known situation:
- tasks currently only has the automatically-created primary-key index on `id`.
- `EXPLAIN ANALYZE SELECT * FROM tasks WHERE project_id = 1;`
  currently shows a sequential scan.
- The application frequently retrieves tasks using `projectId`.
- Task listing also supports filters such as:
  - sprintId
  - status
  - priority
  - assignedTo
- Task listing supports pagination, search and sorting.
- Do NOT blindly create an index for every column.

Please:

1. Inspect the actual migrations and current service queries for:
   - tasks
   - projects
   - sprints
   - team_members
   - comments

2. Identify the most useful indexes based on the application's existing query patterns.

3. Check whether an index already exists before adding an equivalent/redundant one.

4. At minimum, evaluate whether `tasks.project_id` should be indexed because task retrieval frequently uses:
   WHERE project_id = ?

5. Evaluate useful foreign-key/access-pattern indexes such as project/team, sprint/project, comments/task, membership lookups, etc., but only add them when justified by existing queries.

6. Consider composite indexes ONLY when an existing frequent query pattern genuinely benefits from one. Do not over-index the database.

7. Create proper Sequelize migration file(s) for the indexes.

Use actual database column names in migrations, such as `project_id`, rather than Sequelize model property names such as `projectId`.

Every index must:
- have a clear descriptive name
- be created in `up()`
- be correctly removed in `down()`

8. Run the migrations.

9. Verify the resulting indexes.

10. Where practical, use EXPLAIN / EXPLAIN ANALYZE on representative SELECT queries before/after indexing.

IMPORTANT:
The development database currently contains very little seeded data, so PostgreSQL may still choose a sequential scan even when an index exists. Do not force PostgreSQL to use an index just to produce an Index Scan.

11. Make sure existing APIs and Sequelize models continue working after the changes.

12. Do not modify application behavior just for indexing.

13. Do not add unrelated new concepts or features.

DO NOT implement:
- Redis
- WebSockets
- Docker
- CI/CD
- refresh tokens
- rate limiting
- Swagger
- frontend changes
- major refactoring
- unrelated performance optimizations

At the end, give me a short summary containing:
- migrations created
- indexes added
- table + columns for each index
- why each index was added
- any index considered but intentionally not added
- verification performed
- files changed

Stop after the database indexing/query-performance work is complete.