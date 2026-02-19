// Test Email Service
import dotenv from 'dotenv';
import { sendWelcomeEmail, sendOrderConfirmation, sendPrescriptionStatus } from '../src/services/emailService.js';

dotenv.config();

const testEmails = async () => {
    console.log('📧 Testing Email Service...\n');
    console.log('⚠️  Make sure to configure EMAIL_USER and EMAIL_PASSWORD in .env first!\n');

    // Test user
    const testUser = {
        name: 'Test User',
        email: process.env.EMAIL_USER || 'test@example.com', // Use your own email
        phone: '1234567890',
        address: '123 Test Street, Test City'
    };

    // Test 1: Welcome Email
    console.log('1️⃣  Sending Welcome Email...');
    const welcomeResult = await sendWelcomeEmail(testUser);
    console.log(welcomeResult.success ? '✅ Success' : '❌ Failed:', welcomeResult.error || '');
    console.log('');

    // Test 2: Order Confirmation Email
    console.log('2️⃣  Sending Order Confirmation Email...');
    const testOrder = {
        _id: '507f1f77bcf86cd799439011',
        orderId: 'ORD-2026-001',
        status: 'Processing',
        items: [
            {
                name: 'Paracetamol 500mg',
                quantity: 2,
                price: 50
            },
            {
                name: 'Vitamin D3 Capsules',
                quantity: 1,
                price: 300
            }
        ],
        totalAmount: 450,
        discount: 50,
        shippingFee: 50,
        paymentMethod: 'cod',
        shippingAddress: {
            name: testUser.name,
            address: testUser.address,
            city: 'Test City',
            postalCode: '123456',
            phone: testUser.phone
        }
    };
    const orderResult = await sendOrderConfirmation(testUser, testOrder);
    console.log(orderResult.success ? '✅ Success' : '❌ Failed:', orderResult.error || '');
    console.log('');

    // Test 3: Prescription Approved Email
    console.log('3️⃣  Sending Prescription Approved Email...');
    const testPrescription = {
        _id: 'RX-2026-001',
        medicineName: 'Antibiotics',
        createdAt: new Date()
    };
    const approvedResult = await sendPrescriptionStatus(
        testUser,
        testPrescription,
        'approved',
        'Your prescription has been verified and approved by Dr. Smith.'
    );
    console.log(approvedResult.success ? '✅ Success' : '❌ Failed:', approvedResult.error || '');
    console.log('');

    // Test 4: Prescription Rejected Email
    console.log('4️⃣  Sending Prescription Rejected Email...');
    const rejectedResult = await sendPrescriptionStatus(
        testUser,
        testPrescription,
        'rejected',
        'The prescription image is unclear. Please upload a clearer copy.'
    );
    console.log(rejectedResult.success ? '✅ Success' : '❌ Failed:', rejectedResult.error || '');
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📬 Check your inbox at:', testUser.email);
    console.log('You should receive 4 emails.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

testEmails();
