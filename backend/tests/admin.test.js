// backend/tests/admin.test.js
// Test Suite 3: Admin Controller
// Tests admin authorization, user management (CRUD), and toggle status.

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
    sendOrderConfirmation: jest.fn().mockResolvedValue(true),
    sendOrderStatusEmail: jest.fn().mockResolvedValue(true),
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

import authRoutes from "../src/routes/authRoutes.js";
import adminRoutes from "../src/routes/adminRoutes.js";
import { notFound, errorHandler } from "../src/middleware/errorMiddleware.js";
import User from "../src/models/User.js";
import {
    createTestUser,
    createTestAdmin,
    DEFAULT_PASSWORD
} from "./helpers.js";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use(notFound);
app.use(errorHandler);

let mongod;

beforeAll(async () => {
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

const loginAs = async (email, password = DEFAULT_PASSWORD) => {
    const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password });
    return res.headers["set-cookie"];
};

// ─────────────────────────────────────────────────────────────────────────────
describe("Admin Authorization", () => {
    it("should reject non-admin access to admin routes (403)", async () => {
        await createTestUser({ email: "regular@test.com" });
        const cookies = await loginAs("regular@test.com");

        const res = await request(app)
            .get("/api/admin/users")
            .set("Cookie", cookies);

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/admin access/i);
    });

    it("should allow admin access to admin routes (200)", async () => {
        await createTestAdmin({ email: "admin@test.com" });
        const cookies = await loginAs("admin@test.com");

        const res = await request(app)
            .get("/api/admin/users")
            .set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("users");
    });

    it("should require authentication for admin routes (401)", async () => {
        const res = await request(app)
            .get("/api/admin/users");

        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/admin/users", () => {
    it("should return paginated user list", async () => {
        await createTestAdmin({ email: "admin2@test.com" });
        // Create 5 extra users
        for (let i = 0; i < 5; i++) {
            await createTestUser({ email: `user${i}@test.com`, name: `User ${i}` });
        }

        const cookies = await loginAs("admin2@test.com");
        const res = await request(app)
            .get("/api/admin/users")
            .set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body.users).toBeInstanceOf(Array);
        expect(res.body).toHaveProperty("total");
        expect(res.body).toHaveProperty("pages");
        expect(res.body.total).toBe(6); // admin + 5 users
    });

    it("should not expose password in user list", async () => {
        await createTestAdmin({ email: "admin3@test.com" });
        await createTestUser({ email: "checkpw@test.com" });

        const cookies = await loginAs("admin3@test.com");
        const res = await request(app)
            .get("/api/admin/users")
            .set("Cookie", cookies);

        res.body.users.forEach(user => {
            expect(user).not.toHaveProperty("password");
        });
    });

    it("should respect page and limit query params", async () => {
        await createTestAdmin({ email: "adminpag@test.com" });
        for (let i = 0; i < 5; i++) {
            await createTestUser({ email: `paguser${i}@test.com`, name: `PagUser ${i}` });
        }

        const cookies = await loginAs("adminpag@test.com");
        const res = await request(app)
            .get("/api/admin/users?page=1&limit=3")
            .set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body.users).toHaveLength(3);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /api/admin/users/:id/toggle", () => {
    it("should suspend an active user (isActive: true → false)", async () => {
        await createTestAdmin({ email: "admintog@test.com" });
        const targetUser = await createTestUser({ email: "target@test.com" });

        const cookies = await loginAs("admintog@test.com");
        const res = await request(app)
            .patch(`/api/admin/users/${targetUser._id}/toggle`)
            .set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body.isActive).toBe(false);

        // Verify user is unable to access protected resources after suspension
        const loginCookies = await loginAs("target@test.com");
        const profileRes = await request(app)
            .get("/api/auth/me")
            .set("Cookie", loginCookies);
        // Middleware should block suspended user
        expect(profileRes.status).toBe(401);
        expect(profileRes.body.message).toMatch(/suspended/i);
    });

    it("should reactivate a suspended user", async () => {
        await createTestAdmin({ email: "adminreact@test.com" });
        const targetUser = await createTestUser({
            email: "suspended@test.com",
            isActive: false
        });

        const cookies = await loginAs("adminreact@test.com");
        const res = await request(app)
            .patch(`/api/admin/users/${targetUser._id}/toggle`)
            .set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body.isActive).toBe(true);
    });

    it("should not allow admin to toggle their own status", async () => {
        const admin = await createTestAdmin({ email: "selfadmin@test.com" });
        const cookies = await loginAs("selfadmin@test.com");

        const res = await request(app)
            .patch(`/api/admin/users/${admin._id}/toggle`)
            .set("Cookie", cookies);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/own status/i);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/admin/users — Create User by Admin", () => {
    it("admin-created user should be able to login (no double-hashing)", async () => {
        await createTestAdmin({ email: "admincreate@test.com" });
        const cookies = await loginAs("admincreate@test.com");

        // Admin creates a user with plain password
        const createRes = await request(app)
            .post("/api/admin/users")
            .set("Cookie", cookies)
            .send({
                name: "Created User",
                email: "created@test.com",
                password: "Password123!"
            });

        expect(createRes.status).toBe(201);

        // Created user must be able to log in — tests that no double-hashing occurred
        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "created@test.com", password: "Password123!" });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.email).toBe("created@test.com");
    });

    it("should fail if admin-created user email already exists", async () => {
        await createTestAdmin({ email: "admindup@test.com" });
        await createTestUser({ email: "existing@test.com" });
        const cookies = await loginAs("admindup@test.com");

        const res = await request(app)
            .post("/api/admin/users")
            .set("Cookie", cookies)
            .send({ name: "Dup", email: "existing@test.com", password: "Password123!" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already exists/i);
    });

    it("should fail if required fields are missing", async () => {
        await createTestAdmin({ email: "adminreq@test.com" });
        const cookies = await loginAs("adminreq@test.com");

        const res = await request(app)
            .post("/api/admin/users")
            .set("Cookie", cookies)
            .send({ name: "No Email" }); // Missing email and password

        expect(res.status).toBe(400);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/admin/users/:id", () => {
    it("should delete a user with no orders", async () => {
        await createTestAdmin({ email: "admindel@test.com" });
        const target = await createTestUser({ email: "deleteme@test.com" });
        const cookies = await loginAs("admindel@test.com");

        const res = await request(app)
            .delete(`/api/admin/users/${target._id}`)
            .set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const found = await User.findById(target._id);
        expect(found).toBeNull();
    });

    it("should prevent admin from deleting themselves", async () => {
        const admin = await createTestAdmin({ email: "selfdelete@test.com" });
        const cookies = await loginAs("selfdelete@test.com");

        const res = await request(app)
            .delete(`/api/admin/users/${admin._id}`)
            .set("Cookie", cookies);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/cannot delete your own/i);
    });

    it("should return 404 for non-existent user", async () => {
        await createTestAdmin({ email: "admin404@test.com" });
        const cookies = await loginAs("admin404@test.com");
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .delete(`/api/admin/users/${fakeId}`)
            .set("Cookie", cookies);

        expect(res.status).toBe(404);
    });
});
