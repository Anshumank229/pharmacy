// backend/tests/order.test.js
// Test Suite 2: Order Controller
// Tests order creation (with coupon rules), my-orders pagination, and order cancellation.

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
    sendOrderConfirmation: jest.fn().mockResolvedValue(true),
    sendOrderStatusEmail: jest.fn().mockResolvedValue(true),
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

import authRoutes from "../src/routes/authRoutes.js";
import orderRoutes from "../src/routes/orderRoutes.js";
import { notFound, errorHandler } from "../src/middleware/errorMiddleware.js";
import Medicine from "../src/models/Medicine.js";
import Order from "../src/models/Order.js";
import Cart from "../src/models/Cart.js";
import Coupon from "../src/models/Coupon.js";
import {
    createTestUser,
    createTestAdmin,
    createTestMedicine,
    createTestOrder,
    buildOrderPayload,
    seedCart,
    DEFAULT_PASSWORD
} from "./helpers.js";

// ─── Test app ─────────────────────────────────────────────────────────────────
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use(notFound);
app.use(errorHandler);

// ─── Lifecycle ────────────────────────────────────────────────────────────────
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

// ─── Helper: login and return cookie ─────────────────────────────────────────
const loginUser = async (email, password = DEFAULT_PASSWORD) => {
    const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password });
    return res.headers["set-cookie"];
};

// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/orders — Create Order", () => {
    it("should create order successfully (COD, from cart)", async () => {
        const user = await createTestUser({ email: "order1@test.com" });
        const med = await createTestMedicine({ name: "Paracetamol", stock: 20 });

        // Seed the cart
        await Cart.create({
            user: user._id,
            items: [{ medicine: med._id, quantity: 2 }]
        });

        const cookies = await loginUser("order1@test.com");

        const res = await request(app)
            .post("/api/orders")
            .set("Cookie", cookies)
            .send(buildOrderPayload([med]));

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("_id");
        expect(["pending", "processing"]).toContain(res.body.orderStatus);
        expect(res.body.paymentStatus).toBe("pending");

        // Stock should have been reduced
        const updated = await Medicine.findById(med._id);
        expect(updated.stock).toBeLessThan(20);
    });

    it("should fail with insufficient stock", async () => {
        const user = await createTestUser({ email: "stock@test.com" });
        const med = await createTestMedicine({ stock: 2 });
        await Cart.create({
            user: user._id,
            items: [{ medicine: med._id, quantity: 5 }] // Request 5, only 2 in stock
        });

        const cookies = await loginUser("stock@test.com");
        const res = await request(app)
            .post("/api/orders")
            .set("Cookie", cookies)
            .send(buildOrderPayload([med]));

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/insufficient stock/i);
    });

    it("should fail with empty cart", async () => {
        const user = await createTestUser({ email: "emptycart@test.com" });
        // No cart created

        const cookies = await loginUser("emptycart@test.com");
        const res = await request(app)
            .post("/api/orders")
            .set("Cookie", cookies)
            .send(buildOrderPayload([]));

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/cart is empty/i);
    });

    it("should apply valid coupon and reduce total", async () => {
        const user = await createTestUser({ email: "coupon@test.com" });
        const med = await createTestMedicine({ price: 200, stock: 10 });
        await Cart.create({
            user: user._id,
            items: [{ medicine: med._id, quantity: 1 }]
        });

        await Coupon.create({
            code: "SAVE10",
            discountPercent: 10,
            isActive: true,
            usageLimit: null,
            usedCount: 0,
            perUserLimit: 5,
            minOrderAmount: 0
        });

        const cookies = await loginUser("coupon@test.com");
        const res = await request(app)
            .post("/api/orders")
            .set("Cookie", cookies)
            .send({ ...buildOrderPayload([med]), couponCode: "SAVE10" });

        expect(res.status).toBe(201);
        // 200 - 10% = 180
        expect(res.body.totalAmount).toBe(180);
        expect(res.body.discount).toBeGreaterThan(0);

        // Coupon usedCount should now be 1
        const updatedCoupon = await Coupon.findOne({ code: "SAVE10" });
        expect(updatedCoupon.usedCount).toBe(1);
    });

    it("should reject expired coupon", async () => {
        const user = await createTestUser({ email: "expired@test.com" });
        const med = await createTestMedicine({ stock: 10 });
        await Cart.create({
            user: user._id,
            items: [{ medicine: med._id, quantity: 1 }]
        });

        await Coupon.create({
            code: "EXPIRED",
            discountPercent: 10,
            isActive: true,
            validUntil: new Date("2020-01-01"), // expired
            usedCount: 0,
            perUserLimit: 5,
            minOrderAmount: 0
        });

        const cookies = await loginUser("expired@test.com");
        const res = await request(app)
            .post("/api/orders")
            .set("Cookie", cookies)
            .send({ ...buildOrderPayload([med]), couponCode: "EXPIRED" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/expired/i);
    });

    it("should reject coupon over usage limit", async () => {
        const user = await createTestUser({ email: "usagelimit@test.com" });
        const med = await createTestMedicine({ stock: 10 });
        await Cart.create({
            user: user._id,
            items: [{ medicine: med._id, quantity: 1 }]
        });

        await Coupon.create({
            code: "MAXEDOUT",
            discountPercent: 10,
            isActive: true,
            usageLimit: 1,
            usedCount: 1, // already at limit
            perUserLimit: 5,
            minOrderAmount: 0
        });

        const cookies = await loginUser("usagelimit@test.com");
        const res = await request(app)
            .post("/api/orders")
            .set("Cookie", cookies)
            .send({ ...buildOrderPayload([med]), couponCode: "MAXEDOUT" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/usage limit/i);
    });

    it("should reject firstTimeOnly coupon for returning user", async () => {
        const user = await createTestUser({ email: "returning@test.com" });
        const med = await createTestMedicine({ stock: 10 });

        // Create a prior non-cancelled order for the user
        await createTestOrder(user._id, med._id, 100, { orderStatus: "delivered" });

        // Put new item in cart
        await Cart.create({
            user: user._id,
            items: [{ medicine: med._id, quantity: 1 }]
        });

        await Coupon.create({
            code: "FIRSTBUY",
            discountPercent: 20,
            isActive: true,
            firstTimeOnly: true,
            usedCount: 0,
            perUserLimit: 5,
            minOrderAmount: 0
        });

        const cookies = await loginUser("returning@test.com");
        const res = await request(app)
            .post("/api/orders")
            .set("Cookie", cookies)
            .send({ ...buildOrderPayload([med]), couponCode: "FIRSTBUY" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/first.?time/i);
    });

    it("should not allow unauthenticated order creation", async () => {
        const med = await createTestMedicine();
        const res = await request(app)
            .post("/api/orders")
            .send(buildOrderPayload([med]));

        expect(res.status).toBe(401);
    });

    it("should fail if shippingAddress is missing", async () => {
        const user = await createTestUser({ email: "noaddr@test.com" });
        const med = await createTestMedicine({ stock: 10 });
        await Cart.create({
            user: user._id,
            items: [{ medicine: med._id, quantity: 1 }]
        });

        const cookies = await loginUser("noaddr@test.com");
        const res = await request(app)
            .post("/api/orders")
            .set("Cookie", cookies)
            .send({ paymentMethod: "cod" }); // missing shippingAddress

        expect(res.status).toBe(400);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/orders/my-orders", () => {
    it("should return only the authenticated user's orders", async () => {
        const userA = await createTestUser({ email: "usera@test.com" });
        const userB = await createTestUser({ email: "userb@test.com" });
        const med = await createTestMedicine();

        // 3 orders for User A, 2 for User B
        for (let i = 0; i < 3; i++) await createTestOrder(userA._id, med._id, 100);
        for (let i = 0; i < 2; i++) await createTestOrder(userB._id, med._id, 100);

        const cookies = await loginUser("usera@test.com");
        const res = await request(app)
            .get("/api/orders/my-orders")
            .set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body.orders).toHaveLength(3);
        res.body.orders.forEach(o => {
            expect(o.user.toString()).toBe(userA._id.toString());
        });
    });

    it("should respect page and limit params", async () => {
        const user = await createTestUser({ email: "paginate@test.com" });
        const med = await createTestMedicine();
        for (let i = 0; i < 5; i++) await createTestOrder(user._id, med._id, 100);

        const cookies = await loginUser("paginate@test.com");
        const res = await request(app)
            .get("/api/orders/my-orders?page=1&limit=2")
            .set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body.orders).toHaveLength(2);
        expect(res.body.pages).toBe(3);
        expect(res.body.total).toBe(5);
    });

    it("should return empty array when user has no orders", async () => {
        await createTestUser({ email: "noorders@test.com" });
        const cookies = await loginUser("noorders@test.com");

        const res = await request(app)
            .get("/api/orders/my-orders")
            .set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body.orders).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("PUT /api/orders/:id/cancel", () => {
    it("should cancel a processing order and restore stock", async () => {
        const user = await createTestUser({ email: "cancel@test.com" });
        const med = await createTestMedicine({ stock: 10 });
        const order = await createTestOrder(user._id, med._id, 100, {
            orderStatus: "processing",
            items: [{ medicine: med._id, quantity: 2, price: 100 }]
        });

        // Simulate stock already deducted
        await Medicine.findByIdAndUpdate(med._id, { stock: 8 });

        const cookies = await loginUser("cancel@test.com");
        const res = await request(app)
            .put(`/api/orders/${order._id}/cancel`)
            .set("Cookie", cookies);

        expect(res.status).toBe(200);
        expect(res.body.orderStatus).toBe("cancelled");

        // Stock should be restored
        const updatedMed = await Medicine.findById(med._id);
        expect(updatedMed.stock).toBe(10);
    });

    it("should not cancel a shipped order", async () => {
        const user = await createTestUser({ email: "cancelshipped@test.com" });
        const med = await createTestMedicine({ stock: 10 });
        const order = await createTestOrder(user._id, med._id, 100, {
            orderStatus: "shipped"
        });

        const cookies = await loginUser("cancelshipped@test.com");
        const res = await request(app)
            .put(`/api/orders/${order._id}/cancel`)
            .set("Cookie", cookies);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/cannot cancel/i);
    });

    it("should not allow cancelling another user's order", async () => {
        const userA = await createTestUser({ email: "ownercancel@test.com" });
        const userB = await createTestUser({ email: "attackercancel@test.com" });
        const med = await createTestMedicine({ stock: 10 });
        const order = await createTestOrder(userA._id, med._id, 100, {
            orderStatus: "processing"
        });

        const cookiesB = await loginUser("attackercancel@test.com");
        const res = await request(app)
            .put(`/api/orders/${order._id}/cancel`)
            .set("Cookie", cookiesB);

        expect([403, 404]).toContain(res.status);
    });

    it("should return 404 for non-existent order", async () => {
        const user = await createTestUser({ email: "notfound@test.com" });
        const cookies = await loginUser("notfound@test.com");
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .put(`/api/orders/${fakeId}/cancel`)
            .set("Cookie", cookies);

        expect(res.status).toBe(404);
    });
});
