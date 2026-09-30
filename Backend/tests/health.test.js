import request from "supertest";
import app from "../src/app.js";

describe("Health API", () => {
  test("GET /api/health should return API health status", async () => {
    const response = await request(app)
      .get("/api/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "SyncSprint API is running",
    });
  });

  test("GET /api/health/redis should return Redis status and operating mode", async () => {
    const response = await request(app).get("/api/health/redis");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.redis).toBeDefined();
    expect(typeof response.body.redis.connected).toBe("boolean");
    expect(["active", "fallback"]).toContain(response.body.redis.mode);
  });
});