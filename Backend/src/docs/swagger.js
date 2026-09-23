export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "SyncSprint API Documentation",
    version: "1.0.0",
    description:
      "Comprehensive REST API documentation for SyncSprint project, sprint, task, and team management backend.",
  },
  servers: [
    {
      url: "/api",
      description: "API base path",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token to authenticate (Bearer <token>)",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Error message" },
        },
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "email" },
                message: { type: "string", example: "Valid email is required" },
              },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          role: {
            type: "string",
            enum: ["SUPER_ADMIN", "ADMIN", "DEVELOPER"],
            example: "DEVELOPER",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Team: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Frontend Engineering" },
          description: { type: "string", example: "Core frontend dev team" },
          ownerId: { type: "integer", example: 1 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      TeamMember: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          teamId: { type: "integer", example: 1 },
          userId: { type: "integer", example: 2 },
          role: { type: "string", enum: ["OWNER", "ADMIN", "MEMBER"], example: "MEMBER" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Mobile App Redesign" },
          description: { type: "string", example: "Revamping the iOS and Android applications" },
          teamId: { type: "integer", example: 1 },
          status: { type: "string", enum: ["ACTIVE", "ARCHIVED"], example: "ACTIVE" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Sprint: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Sprint 1 - Foundation" },
          goal: { type: "string", example: "Complete initial authentication and architecture setup" },
          projectId: { type: "integer", example: 1 },
          startDate: { type: "string", format: "date", example: "2026-10-01" },
          endDate: { type: "string", format: "date", example: "2026-10-15" },
          status: {
            type: "string",
            enum: ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"],
            example: "PLANNED",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Setup CI/CD Pipeline" },
          description: { type: "string", example: "Configure GitHub Actions workflows" },
          status: {
            type: "string",
            enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
            example: "TODO",
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            example: "HIGH",
          },
          storyPoints: { type: "integer", example: 5 },
          projectId: { type: "integer", example: 1 },
          sprintId: { type: "integer", nullable: true, example: 1 },
          assignedTo: { type: "integer", nullable: true, example: 2 },
          createdBy: { type: "integer", example: 1 },
          dueDate: { type: "string", format: "date", nullable: true, example: "2026-10-10" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Comment: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          content: { type: "string", example: "PR has been opened for this task." },
          taskId: { type: "integer", example: 1 },
          userId: { type: "integer", example: 2 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "John Doe", maxLength: 100 },
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", minLength: 6, example: "Secret123!" },
          role: {
            type: "string",
            enum: ["SUPER_ADMIN", "ADMIN", "DEVELOPER"],
            default: "DEVELOPER",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "john@example.com" },
          password: { type: "string", example: "Secret123!" },
        },
      },
      CreateTeamRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Engineering Team", maxLength: 100 },
          description: { type: "string", example: "Core engineering group", maxLength: 1000 },
        },
      },
      AddTeamMemberRequest: {
        type: "object",
        required: ["userId"],
        properties: {
          userId: { type: "integer", example: 2 },
          role: { type: "string", enum: ["ADMIN", "MEMBER"], default: "MEMBER" },
        },
      },
      UpdateTeamMemberRoleRequest: {
        type: "object",
        required: ["role"],
        properties: {
          role: { type: "string", enum: ["ADMIN", "MEMBER"], example: "ADMIN" },
        },
      },
      CreateProjectRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "SyncSprint Backend", maxLength: 150 },
          description: { type: "string", example: "Express 5 Backend Service", maxLength: 5000 },
        },
      },
      UpdateProjectRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Updated Project Name", maxLength: 150 },
          description: { type: "string", example: "Updated description", maxLength: 5000 },
          status: { type: "string", enum: ["ACTIVE", "ARCHIVED"] },
        },
      },
      CreateSprintRequest: {
        type: "object",
        required: ["name", "startDate", "endDate"],
        properties: {
          name: { type: "string", example: "Sprint 1", maxLength: 150 },
          goal: { type: "string", example: "Deliver MVP authentication", maxLength: 5000 },
          startDate: { type: "string", format: "date", example: "2026-10-01" },
          endDate: { type: "string", format: "date", example: "2026-10-15" },
        },
      },
      UpdateSprintRequest: {
        type: "object",
        properties: {
          name: { type: "string", maxLength: 150 },
          goal: { type: "string", maxLength: 5000 },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          status: { type: "string", enum: ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"] },
        },
      },
      CreateTaskRequest: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", example: "Design DB Schema", maxLength: 200 },
          description: { type: "string", example: "Design ER diagram", maxLength: 10000 },
          status: {
            type: "string",
            enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
            default: "TODO",
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            default: "MEDIUM",
          },
          storyPoints: { type: "integer", minimum: 0, example: 3 },
          assignedTo: { type: "integer", example: 2 },
          dueDate: { type: "string", format: "date", example: "2026-10-08" },
          sprintId: { type: "integer", example: 1 },
        },
      },
      UpdateTaskRequest: {
        type: "object",
        properties: {
          title: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 10000 },
          status: { type: "string", enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
          storyPoints: { type: "integer", minimum: 0 },
          assignedTo: { type: "integer", nullable: true },
          dueDate: { type: "string", format: "date", nullable: true },
          sprintId: { type: "integer", nullable: true },
        },
      },
      CreateCommentRequest: {
        type: "object",
        required: ["content"],
        properties: {
          content: { type: "string", example: "Working on this now.", maxLength: 10000 },
        },
      },
      UpdateCommentRequest: {
        type: "object",
        required: ["content"],
        properties: {
          content: { type: "string", example: "Updated comment text.", maxLength: 10000 },
        },
      },
    },
  },
  tags: [
    { name: "Auth", description: "Authentication and user identity" },
    { name: "Teams", description: "Team management and member role assignments" },
    { name: "Projects", description: "Projects lifecycle and management" },
    { name: "Sprints", description: "Sprint planning and tracking" },
    { name: "Tasks", description: "Task items and workflow state" },
    { name: "Comments", description: "Task comments and collaboration" },
    { name: "Health", description: "API health and diagnostics" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health status",
        description: "Returns health status of the SyncSprint Express backend.",
        responses: {
          200: {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "SyncSprint API is running" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description: "Creates a new user account with specified credentials and role.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User registered successfully" },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error or email already registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          429: {
            description: "Too many authentication requests",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in an existing user",
        description: "Validates user credentials and issues a JWT Bearer token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Authentication successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login successful" },
                    token: { type: "string", example: "eyJhbGciOi..." },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          400: {
            description: "Invalid request format",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          401: {
            description: "Invalid email or password",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          429: {
            description: "Too many authentication attempts",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Current user profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized - missing or invalid JWT",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/teams": {
      post: {
        tags: ["Teams"],
        summary: "Create a new team",
        description: "Creates a new team. Requires SUPER_ADMIN or ADMIN role.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTeamRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Team created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Team created successfully" },
                    data: { $ref: "#/components/schemas/Team" },
                  },
                },
              },
            },
          },
          400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationErrorResponse" } } } },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - requires SUPER_ADMIN or ADMIN" },
        },
      },
      get: {
        tags: ["Teams"],
        summary: "List user's teams",
        description: "Returns all teams the authenticated user belongs to.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Teams retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Team" },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/teams/{teamId}/members": {
      post: {
        tags: ["Teams"],
        summary: "Add a member to a team",
        description: "Adds a user to the team. Requires team OWNER or ADMIN role.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "teamId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "ID of the team",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddTeamMemberRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Member added successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Member added successfully" },
                    data: { $ref: "#/components/schemas/TeamMember" },
                  },
                },
              },
            },
          },
          400: { description: "Validation error or user already a member" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - requires team OWNER or ADMIN" },
          404: { description: "Team or User not found" },
        },
      },
    },
    "/teams/{teamId}/members/{userId}": {
      patch: {
        tags: ["Teams"],
        summary: "Update team member role",
        description: "Updates member role (ADMIN/MEMBER). Requires team OWNER role.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "teamId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateTeamMemberRoleRequest" },
            },
          },
        },
        responses: {
          200: { description: "Team member role updated successfully" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - only team OWNER can update roles" },
          404: { description: "Team member not found" },
        },
      },
      delete: {
        tags: ["Teams"],
        summary: "Remove member from team",
        description: "Removes a user from the team. Requires team OWNER or ADMIN role.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "teamId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Member removed from team successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Team member not found" },
        },
      },
    },
    "/teams/{teamId}/projects": {
      post: {
        tags: ["Projects"],
        summary: "Create a project within a team",
        description: "Creates a project in the specified team. Requires team OWNER or ADMIN.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "teamId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateProjectRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Project created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Project created successfully" },
                    data: { $ref: "#/components/schemas/Project" },
                  },
                },
              },
            },
          },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Team not found" },
        },
      },
      get: {
        tags: ["Projects"],
        summary: "List all projects for a team",
        description: "Returns projects belonging to the specified team. Requires team membership.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "teamId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Projects retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Project" },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/projects/{projectId}": {
      get: {
        tags: ["Projects"],
        summary: "Get project details by ID",
        description: "Retrieves project details. Requires membership in the team.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Project details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Project" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Project not found" },
        },
      },
      patch: {
        tags: ["Projects"],
        summary: "Update project",
        description: "Updates project name, description, or status. Requires team OWNER or ADMIN.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProjectRequest" },
            },
          },
        },
        responses: {
          200: { description: "Project updated successfully" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Project not found" },
        },
      },
      delete: {
        tags: ["Projects"],
        summary: "Archive/Delete project",
        description: "Archives the project. Requires team OWNER role.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Project archived successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - only team OWNER can archive" },
          404: { description: "Project not found" },
        },
      },
    },
    "/projects/{projectId}/sprints": {
      post: {
        tags: ["Sprints"],
        summary: "Create a sprint in a project",
        description: "Creates a sprint. Requires team OWNER or ADMIN.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateSprintRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Sprint created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Sprint created successfully" },
                    data: { $ref: "#/components/schemas/Sprint" },
                  },
                },
              },
            },
          },
          400: { description: "Validation error (e.g. invalid dates)" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Project not found" },
        },
      },
      get: {
        tags: ["Sprints"],
        summary: "List all sprints in a project",
        description: "Returns sprints for the specified project. Requires team membership.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Sprints retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Sprint" },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/projects/{projectId}/tasks": {
      post: {
        tags: ["Tasks"],
        summary: "Create a task in a project",
        description: "Creates a task item. Requires team membership.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTaskRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Task created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Task created successfully" },
                    data: { $ref: "#/components/schemas/Task" },
                  },
                },
              },
            },
          },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Project not found" },
        },
      },
      get: {
        tags: ["Tasks"],
        summary: "List tasks in a project with optional filters",
        description: "Returns tasks filtered by status, priority, sprintId, or assignedTo.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] },
          },
          {
            name: "priority",
            in: "query",
            schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
          },
          {
            name: "sprintId",
            in: "query",
            schema: { type: "integer" },
          },
          {
            name: "assignedTo",
            in: "query",
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Tasks retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Task" },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/sprints/{sprintId}": {
      get: {
        tags: ["Sprints"],
        summary: "Get sprint details by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "sprintId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Sprint details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Sprint" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Sprint not found" },
        },
      },
      patch: {
        tags: ["Sprints"],
        summary: "Update sprint",
        description: "Updates sprint details or status. Requires team OWNER or ADMIN.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "sprintId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateSprintRequest" },
            },
          },
        },
        responses: {
          200: { description: "Sprint updated successfully" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Sprint not found" },
        },
      },
    },
    "/sprints/{sprintId}/tasks": {
      get: {
        tags: ["Sprints"],
        summary: "List all tasks in a sprint",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "sprintId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Tasks in sprint retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Task" },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Sprint not found" },
        },
      },
    },
    "/tasks/{taskId}": {
      get: {
        tags: ["Tasks"],
        summary: "Get task details by ID",
        description: "Retrieves task details with assigner, creator, sprint, and comments.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "taskId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Task details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Task" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Task not found" },
        },
      },
      patch: {
        tags: ["Tasks"],
        summary: "Update task",
        description: "Updates task properties. Requires team membership.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "taskId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateTaskRequest" },
            },
          },
        },
        responses: {
          200: { description: "Task updated successfully" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Task not found" },
        },
      },
      delete: {
        tags: ["Tasks"],
        summary: "Delete a task",
        description: "Deletes a task. Requires team OWNER, ADMIN, or the task creator.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "taskId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Task deleted successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Task not found" },
        },
      },
    },
    "/tasks/{taskId}/comments": {
      post: {
        tags: ["Comments"],
        summary: "Add a comment to a task",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "taskId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCommentRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Comment added successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Comment added successfully" },
                    data: { $ref: "#/components/schemas/Comment" },
                  },
                },
              },
            },
          },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Task not found" },
        },
      },
      get: {
        tags: ["Comments"],
        summary: "List all comments on a task",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "taskId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Comments retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Comment" },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Task not found" },
        },
      },
    },
    "/comments/{commentId}": {
      patch: {
        tags: ["Comments"],
        summary: "Update a comment",
        description: "Updates comment content. Requires being the comment author.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "commentId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateCommentRequest" },
            },
          },
        },
        responses: {
          200: { description: "Comment updated successfully" },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - only author can update" },
          404: { description: "Comment not found" },
        },
      },
      delete: {
        tags: ["Comments"],
        summary: "Delete a comment",
        description: "Deletes a comment. Requires author or team OWNER/ADMIN.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "commentId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Comment deleted successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Comment not found" },
        },
      },
    },
  },
};
