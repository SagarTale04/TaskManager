import request from "supertest";
import express from "express";
import rateLimit from "express-rate-limit";
import app from "../src/app.js";

describe("Security Hardening", () => {
  describe("Helmet Security Headers", () => {
    test("should include standard Helmet security headers on responses", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      // Helmet headers
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
      expect(response.headers["x-dns-prefetch-control"]).toBe("off");
      // Express signature should be hidden
      expect(response.headers["x-powered-by"]).toBeUndefined();
    });
  });

  describe("CORS Configuration", () => {
    test("should allow requests from configured origin", async () => {
      const response = await request(app)
        .get("/api/health")
        .set("Origin", "http://localhost:3000");

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000"
      );
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    test("should allow requests without an Origin header (e.g. server-to-server or tools)", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should reject requests from unauthorized origins with 403", async () => {
      const response = await request(app)
        .get("/api/health")
        .set("Origin", "http://unauthorized-attacker-site.com");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        message: "Not allowed by CORS",
      });
    });
  });

  describe("Rate Limiting Behavior", () => {
    test("should skip rate limits in test environment on main app", async () => {
      // Send multiple requests to auth routes to verify test environment bypasses limits
      for (let i = 0; i < 12; i++) {
        const response = await request(app)
          .post("/api/auth/login")
          .send({ email: "nonexistent@example.com", password: "Password123!" });

        // Should receive 401 or 400, never 429
        expect(response.status).not.toBe(429);
      }
    });

    test("should enforce 429 when rate limit threshold is exceeded", async () => {
      // Test isolated rate limiter instance to verify standard 429 response structure
      const testApp = express();
      const limiter = rateLimit({
        windowMs: 60 * 1000,
        max: 2,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          return res.status(429).json({
            success: false,
            message: "Too many requests, please try again later",
          });
        },
      });

      testApp.use("/test-limit", limiter, (req, res) => {
        res.status(200).json({ success: true });
      });

      // 1st request - OK
      const res1 = await request(testApp).get("/test-limit");
      expect(res1.status).toBe(200);

      // 2nd request - OK
      const res2 = await request(testApp).get("/test-limit");
      expect(res2.status).toBe(200);

      // 3rd request - Blocked with 429
      const res3 = await request(testApp).get("/test-limit");
      expect(res3.status).toBe(429);
      expect(res3.body).toEqual({
        success: false,
        message: "Too many requests, please try again later",
      });
    });
  });
});
