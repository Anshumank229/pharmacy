import twilio from 'twilio';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

// Check if Twilio credentials are properly configured
const isTwilioConfigured = process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
  process.env.TWILIO_ACCOUNT_SID !== 'your_account_sid_here';

// Initialize Twilio client only if credentials are valid
let client = null;
if (isTwilioConfigured) {
  try {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    logger.info('Twilio client initialized successfully');
  } catch (error) {
    logger.warn('Twilio initialization failed:', error.message);
  }
} else {
  logger.warn('Twilio not configured - using mock WhatsApp/SMS service');
  logger.warn('   Get credentials at: https://twilio.com/console');
}

/**
 * Mock function for development when Twilio is not configured
 */
const mockSendOTP = (phoneNumber, otp, method) => {
  logger.info(`MOCK ${method.toUpperCase()} OTP: To: ${phoneNumber}, Code: ${otp} (Twilio not configured)`);

  return {
    success: true,
    messageId: 'mock_message_id',
    mock: true
  };
};

/**
 * Send OTP via WhatsApp
 * @param {string} phoneNumber - Phone number (10 digits or with country code)
 * @param {string} otp - 6-digit OTP
 */
export const sendWhatsAppOTP = async (phoneNumber, otp) => {
  // Use mock if Twilio not configured
  if (!client || !isTwilioConfigured) {
    return mockSendOTP(phoneNumber, otp, 'whatsapp');
  }

  try {
    // Format phone number (add +91 if not present)
    const formattedNumber = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+91${phoneNumber}`; // Default to India

    const message = await client.messages.create({
      body: `🔐 Your MedStore verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`
    });

    logger.info(`WhatsApp OTP sent to ${formattedNumber}:`, message.sid);
    return { success: true, messageId: message.sid };
  } catch (error) {
    logger.error('WhatsApp OTP failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP via SMS (fallback for non-WhatsApp users)
 * @param {string} phoneNumber - Phone number (10 digits or with country code)
 * @param {string} otp - 6-digit OTP
 */
export const sendSMSOTP = async (phoneNumber, otp) => {
  // Use mock if Twilio not configured
  if (!client || !isTwilioConfigured) {
    return mockSendOTP(phoneNumber, otp, 'sms');
  }

  try {
    const formattedNumber = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+91${phoneNumber}`;

    const message = await client.messages.create({
      body: `🔐 Your MedStore verification code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });

    logger.info(`SMS OTP sent to ${formattedNumber}:`, message.sid);
    return { success: true, messageId: message.sid };
  } catch (error) {
    logger.error('SMS OTP failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send order update via WhatsApp
 * @param {string} phoneNumber - Customer phone number
 * @param {object} order - Order details
 */
export const sendOrderUpdateWhatsApp = async (phoneNumber, order) => {
  // Use mock if Twilio not configured
  if (!client || !isTwilioConfigured) {
    logger.info(`MOCK ORDER UPDATE WhatsApp: To: ${phoneNumber}, Order #${order._id.slice(-8).toUpperCase()}, Status: ${order.orderStatus}`);
    return { success: true, messageId: 'mock_message_id', mock: true };
  }

  try {
    const formattedNumber = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+91${phoneNumber}`;

    const message = await client.messages.create({
      body: `📦 MedStore Order Update\n\nOrder #${order._id.slice(-8).toUpperCase()}\nStatus: ${order.orderStatus}\nTotal: ₹${order.totalAmount}\n\nTrack your order: ${process.env.FRONTEND_URL}/orders/${order._id}`,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`
    });

    logger.info(`Order update WhatsApp sent to ${formattedNumber}`);
    return { success: true, messageId: message.sid };
  } catch (error) {
    logger.error('Order update WhatsApp failed:', error.message);
    return { success: false, error: error.message };
  }
};