// backend/tests/middleware.test.js
// Test Suite 5: Auth Middleware (protect + adminOnly)
// Tests token validation, blacklist check, suspended user, and admin role enforcement.

jest.mock("../src/config/redis.js", () => ({
    default: {
        get: jest.fn().mockResolvedValue(null),
        setex: jest.fn().mockResolvedValue("OK"),
        del: jest.fn().mockResolvedValue(1),
        on: jest.fn()
    },
    __esModule: true
}));

jest.mock("../src/services/emailService.js", () => ({
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    __esModule: true
}));

jest.mock("../src/server.js", () => ({
    authLimiter: (req, res, next) => next(),
    __esModule: true
}));

import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";

import authRoutes from "../src/routes/authRoutes.js";
import adminRoutes from "../src/routes/adminRoutes.js";
import { protect, adminOnly } from "../src/middleware/authMiddleware.js";
import { notFound, errorHandler } from "../src/middleware/errorMiddleware.js";
import User from "../src/models/User.js";
import { createTestUser, createTestAdmin, DEFAULT_PASSWORD } from "./helpers.js";

// Build a minimal app with a test-only protected route
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// ─── Test-only routes ─────────────────────────────────────────────────────────
app.get("/test/protected", protect, (req, res) => {
    res.json({ message: "ok", userId: req.user._id });
});
app.get("/test/admin-only", protect, adminOnly, (req, res) => {
    res.json({ message: "admin ok" });
});

app.use(notFound);
app.use(errorHandler);

const SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "test_secret";

let mongod;

beforeAll(async () => {
    process.env.JWT_SECRET = "test_secret";
    process.env.ACCESS_TOKEN_SECRET = "test_secret";
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
}, 30000);

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    jest.clearAllMocks();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("protect middleware", () => {
    it("should allow request with a valid accessToken cookie", async () => {
        const user = await createTestUser({ email: "valid@test.com" });
        const token = jwt.sign({ id: user._id, role: "user" }, SECRET, { expiresIn: "15m" });

        const res = await request(app)
            .get("/test/protected")
            .set("Cookie", `accessToken=${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("ok");
    });

    it("should allow request with Bearer token header", async () => {
        const user = await createTestUser({ email: "bearer@test.com" });
        const token = jwt.sign({ id: user._id, role: "user" }, SECRET, { expiresIn: "15m" });

        const res = await request(app)
            .get("/test/protected")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
    });

    it("should reject request with no token → 401", async () => {
        const res = await request(app).get("/test/protected");
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/no token/i);
    });

    it("should reject expired token → 401 TOKEN_EXPIRED", async () => {
        const user = await createTestUser({ email: "expired@test.com" });
        const token = jwt.sign(
            { id: user._id, role: "user" },
            SECRET,
            { expiresIn: "1ms" } // Expires immediately
        );

        // Wait for it to expire
        await new Promise(r => setTimeout(r, 10));

        const res = await request(app)
            .get("/test/protected")
            .set("Cookie", `accessToken=${token}`);

        expect(res.status).toBe(401);
        expect(res.body.code).toBe("TOKEN_EXPIRED");
    });

    it("should reject completely invalid/tampered token → 401 TOKEN_INVALID", async () => {
        const res = await request(app)
            .get("/test/protected")
            .set("Cookie", "accessToken=tampered.fake.jwt");

        expect(res.status).toBe(401);
        expect(res.body.code).toBe("TOKEN_INVALID");
    });

    it("should reject blacklisted token → 401 TOKEN_BLACKLISTED", async () => {
        const user = await createTestUser({ email: "bl@test.com" });
        const token = jwt.sign({ id: user._id, role: "user" }, SECRET, { expiresIn: "15m" });

        // Make Redis report this token as blacklisted
        const redisMock = (await import("../src/config/redis.js")).default;
        redisMock.get.mockResolvedValueOnce("1");

        const res = await request(app)
            .get("/test/protected")
            .set("Cookie", `accessToken=${token}`);

        expect(res.status).toBe(401);
        expect(res.body.code).toBe("TOKEN_BLACKLISTED");
    });

    it("should NOT block request when Redis is down (fail-open)", async () => {
        const user = await createTestUser({ email: "failopen@test.com" });
        const token = jwt.sign({ id: user._id, role: "user" }, SECRET, { expiresIn: "15m" });

        // Make Redis throw
        const redisMock = (await import("../src/config/redis.js")).default;
        redisMock.get.mockRejectedValueOnce(new Error("Redis connection refused"));

        const res = await request(app)
            .get("/test/protected")
            .set("Cookie", `accessToken=${token}`);

        // Should succeed despite Redis failure (fail-open)
        expect(res.status).toBe(200);
    });

    it("should block suspended user → 401", async () => {
        const user = await createTestUser({ email: "suspmw@test.com", isActive: false });
        const token = jwt.sign({ id: user._id, role: "user" }, SECRET, { expiresIn: "15m" });

        const res = await request(app)
            .get("/test/protected")
            .set("Cookie", `accessToken=${token}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/suspended/i);
    });

    it("should return 401 if user no longer exists in DB", async () => {
        // Create and immediately delete user, then try with their token
        const user = await createTestUser({ email: "deleted@test.com" });
        const token = jwt.sign({ id: user._id, role: "user" }, SECRET, { expiresIn: "15m" });
        await User.findByIdAndDelete(user._id);

        const res = await request(app)
            .get("/test/protected")
            .set("Cookie", `accessToken=${token}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/user not found/i);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("adminOnly middleware", () => {
    it("should allow admin role to pass through", async () => {
        const admin = await createTestAdmin({ email: "adminmw@test.com" });
        const token = jwt.sign({ id: admin._id, role: "admin" }, SECRET, { expiresIn: "15m" });

        const res = await request(app)
            .get("/test/admin-only")
            .set("Cookie", `accessToken=${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("admin ok");
    });

    it("should reject regular user role → 403", async () => {
        const user = await createTestUser({ email: "nonadmin@test.com" });
        const token = jwt.sign({ id: user._id, role: "user" }, SECRET, { expiresIn: "15m" });

        const res = await request(app)
            .get("/test/admin-only")
            .set("Cookie", `accessToken=${token}`);

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/admin access only/i);
    });
});
