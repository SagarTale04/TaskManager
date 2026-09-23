import request from "supertest";
import app from "../src/app.js";

describe("Documentation & Logging APIs", () => {
  describe("OpenAPI JSON Spec", () => {
    test("GET /api/docs.json should return the valid OpenAPI 3.0 specification", async () => {
      const response = await request(app).get("/api/docs.json");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/application\/json/);
      expect(response.body.openapi).toBe("3.0.0");
      expect(response.body.info.title).toBe("SyncSprint API Documentation");

      // Verify Bearer Auth security scheme is documented
      expect(
        response.body.components.securitySchemes.bearerAuth
      ).toBeDefined();
      expect(
        response.body.components.securitySchemes.bearerAuth.type
      ).toBe("http");
      expect(
        response.body.components.securitySchemes.bearerAuth.scheme
      ).toBe("bearer");

      // Verify required resource tags are documented
      const tagNames = response.body.tags.map((t) => t.name);
      expect(tagNames).toEqual(
        expect.arrayContaining([
          "Auth",
          "Teams",
          "Projects",
          "Sprints",
          "Tasks",
          "Comments",
          "Health",
        ])
      );

      // Verify critical paths are documented
      expect(response.body.paths["/auth/register"]).toBeDefined();
      expect(response.body.paths["/auth/login"]).toBeDefined();
      expect(response.body.paths["/auth/me"]).toBeDefined();
      expect(response.body.paths["/teams"]).toBeDefined();
      expect(response.body.paths["/projects/{projectId}"]).toBeDefined();
      expect(response.body.paths["/sprints/{sprintId}"]).toBeDefined();
      expect(response.body.paths["/tasks/{taskId}"]).toBeDefined();
      expect(response.body.paths["/comments/{commentId}"]).toBeDefined();
      expect(response.body.paths["/health"]).toBeDefined();
    });
  });

  describe("Swagger UI Interface", () => {
    test("GET /api/docs should serve Swagger UI HTML", async () => {
      // Swagger UI typically redirects /api/docs to /api/docs/ or serves HTML directly
      const response = await request(app).get("/api/docs/");

      expect([200, 301, 302]).toContain(response.status);
      if (response.status === 200) {
        expect(response.text).toContain("swagger-ui");
      }
    });

    test("GET /api/docs (without trailing slash) should redirect or serve Swagger UI", async () => {
      const response = await request(app).get("/api/docs");
      expect([200, 301, 302]).toContain(response.status);
    });
  });
});
