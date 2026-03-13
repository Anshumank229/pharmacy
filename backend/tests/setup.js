// backend/tests/setup.js
// Global test setup: MongoDB in-memory, Redis mock, Email mock
// This file runs before each test module via jest's setupFiles

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod;

// ─── Global mocks are declared via jest.mock() inside each test file ──────────
// This setup file handles lifecycle (connect / disconnect the in-memory DB).

beforeAll(async () => {
    // Don't connect if already connected (safety guard)
    if (mongoose.connection.readyState === 0) {
        mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri(), {
            // Suppress deprecation warnings in test output
        });
    }
}, 30000); // 30 s timeout — first run must download mongod binary

afterEach(async () => {
    // Wipe all collections clean between tests for full isolation
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
}, 15000);
