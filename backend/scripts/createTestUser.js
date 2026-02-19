// Create test user for login
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

dotenv.config();

const createTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check if test user already exists
        const existingUser = await User.findOne({ email: 'user@test.com' });

        if (existingUser) {
            console.log('✅ Test user already exists!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 Email: user@test.com');
            console.log('🔐 Password: User@123');
            console.log('👤 Name:', existingUser.name);
            console.log('🔑 Role:', existingUser.role);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        } else {
            // Create new test user
            const user = await User.create({
                name: 'Test User',
                email: 'user@test.com',
                password: 'User@123',
                role: 'user',
                phone: '9876543210',
                address: '123 Test Street, Test City'
            });

            console.log('✅ Test user created successfully!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 Email: user@test.com');
            console.log('🔐 Password: User@123');
            console.log('👤 Name:', user.name);
            console.log('📱 Phone:', user.phone);
            console.log('📍 Address:', user.address);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }

        // List all users
        const allUsers = await User.find({}).select('name email role');
        console.log('📋 All Users in Database:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        allUsers.forEach((u, i) => {
            console.log(`${i + 1}. ${u.name} (${u.email}) - Role: ${u.role}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
};

createTestUser();
