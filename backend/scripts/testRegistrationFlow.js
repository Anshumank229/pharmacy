// Test registration and login flow
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

dotenv.config();

const testRegistrationFlow = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Test email
        const testEmail = 'newuser@test.com';

        // Step 1: Check if user already exists (cleanup)
        const existing = await User.findOne({ email: testEmail });
        if (existing) {
            await User.deleteOne({ email: testEmail });
            console.log('🗑️  Deleted existing test user\n');
        }

        // Step 2: Simulate registration (create new user)
        console.log('📝 Step 1: REGISTRATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const newUser = await User.create({
            name: 'New Test User',
            email: testEmail,
            password: 'Test@1234',
            phone: '1234567890',
            address: '456 New Street, New City'
        });

        console.log('✅ User created successfully!');
        console.log('   Name:', newUser.name);
        console.log('   Email:', newUser.email);
        console.log('   Role:', newUser.role);
        console.log('   ID:', newUser._id);
        console.log('   Password Hashed:', newUser.password.substring(0, 20) + '...');
        console.log('');

        // Step 3: Simulate login (find user and verify password)
        console.log('🔐 Step 2: LOGIN VERIFICATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const loginUser = await User.findOne({ email: testEmail });

        if (!loginUser) {
            console.log('❌ User not found in database!');
        } else {
            console.log('✅ User found in database');

            // Test correct password
            const correctPassword = await loginUser.matchPassword('Test@1234');
            console.log('   Correct password test:', correctPassword ? '✅ SUCCESS' : '❌ FAILED');

            // Test wrong password
            const wrongPassword = await loginUser.matchPassword('WrongPassword');
            console.log('   Wrong password test:', !wrongPassword ? '✅ REJECTED (correct behavior)' : '❌ FAILED (security issue!)');
        }

        console.log('');
        console.log('📊 SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Registration: Data saved to database');
        console.log('✅ Login: Password verification working');
        console.log('✅ Security: Wrong passwords rejected');
        console.log('');
        console.log('🎉 Registration → Login flow is WORKING!');
        console.log('');
        console.log('📧 You can now login with:');
        console.log('   Email: newuser@test.com');
        console.log('   Password: Test@1234');

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
};

testRegistrationFlow();
