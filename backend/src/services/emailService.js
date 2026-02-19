import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email service not configured - skipping email send');
      return { success: false, error: 'Email service not configured' };
    }
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'MedStore <noreply@medstore.com>',
      to,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed:', error.message);
    return { success: false, error: error.message };
  }
};

// ── HTML Wrapper ─────────────────────────────────────────────────────────────
function htmlEmailWrapper(bodyHtml) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
    <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:40px 20px;">
          <table width="600" cellpadding="0" cellspacing="0" 
                 style="background:#ffffff;border-radius:12px;overflow:hidden;
                        box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr><td style="background:#1d4ed8;padding:28px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">
                💊 MedStore
              </h1>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">
                Online Pharmacy
              </p>
            </td></tr>
            <!-- Body -->
            <tr><td style="padding:40px;">
              ${bodyHtml}
            </td></tr>
            <!-- Footer -->
            <tr><td style="background:#f8fafc;padding:24px 40px;
                           border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                © 2026 MedStore · Licensed under Drugs and Cosmetics Act, 1940<br>
                This is an automated email. For support, reply to this email.
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

// ── 1. Welcome Email ─────────────────────────────────────────────────────────
export const sendWelcomeEmail = async (user) => {
  const subject = "Welcome to MedStore 💊";
  const { name, email } = user;

  const body = `
    <h2 style="margin:0 0 20px;color:#1e293b;font-size:20px;">Hi ${name},</h2>
    <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
      Your account is ready. Here's what you can do:
    </p>
    <ul style="margin:0 0 24px;padding:0 0 0 20px;color:#475569;line-height:1.6;">
      <li style="margin-bottom:8px;">Order medicines online</li>
      <li style="margin-bottom:8px;">Upload prescriptions for verified medicines</li>
      <li>Track your orders in real time</li>
    </ul>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop" 
         style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;
                border-radius:6px;text-decoration:none;font-weight:600;">
        Start Shopping
      </a>
    </div>
  `;

  return sendEmail(email, subject, htmlEmailWrapper(body));
};

// ── 2. Order Confirmation Email ──────────────────────────────────────────────
export const sendOrderConfirmation = async (user, order) => {
  const subject = `Order Confirmed — #${order._id.toString().slice(-8).toUpperCase()}`;
  const { name, email } = user;

  const itemsRows = order.items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#1e293b;">
        ${item.medicine.name}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#64748b;text-align:center;">
        ${item.quantity}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;color:#1e293b;text-align:right;">
        ₹${item.price}
      </td>
    </tr>
  `).join('');

  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Hi ${name},</h2>
    <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
      Your order has been placed successfully!
    </p>
    
    <div style="background:#f1f5f9;padding:12px 16px;border-radius:6px;display:inline-block;
                color:#475569;font-weight:600;font-size:14px;margin-bottom:24px;">
      Order ID: #${order._id.toString().toUpperCase()}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr>
          <th style="text-align:left;padding-bottom:12px;color:#64748b;font-size:12px;text-transform:uppercase;">Item</th>
          <th style="padding-bottom:12px;color:#64748b;font-size:12px;text-transform:uppercase;">Qty</th>
          <th style="text-align:right;padding-bottom:12px;color:#64748b;font-size:12px;text-transform:uppercase;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr>
          <td colspan="2" style="padding-top:16px;text-align:right;color:#64748b;">Subtotal</td>
          <td style="padding-top:16px;text-align:right;color:#1e293b;">₹${order.totalAmount}</td>
        </tr>
        ${order.coupon ? `
        <tr>
          <td colspan="2" style="padding-top:8px;text-align:right;color:#10b981;">Discount</td>
          <td style="padding-top:8px;text-align:right;color:#10b981;">- Applied</td>
        </tr>` : ''}
        <tr>
          <td colspan="2" style="padding-top:12px;text-align:right;font-weight:700;color:#1e293b;font-size:16px;">Total</td>
          <td style="padding-top:12px;text-align:right;font-weight:700;color:#1e293b;font-size:16px;">₹${order.totalAmount}</td>
        </tr>
      </tbody>
    </table>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;font-weight:700;">
        Shipping Address
      </p>
      <p style="margin:0;color:#334155;line-height:1.5;">
        ${order.shippingAddress}
      </p>
      <div style="margin-top:12px;">
        <span style="display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600;
                     background:${order.paymentMethod === 'cod' ? '#dbeafe' : '#dcfce7'};
                     color:${order.paymentMethod === 'cod' ? '#1e40af' : '#166534'};">
          ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
        </span>
      </div>
    </div>

    <p style="margin:0;color:#64748b;font-size:14px;">
      We'll email you when your order ships.
    </p>
  `;

  return sendEmail(email, subject, htmlEmailWrapper(body));
};

// ── 3. Order Status Update Email ─────────────────────────────────────────────
export const sendOrderStatusEmail = async (email, name, orderId, status) => {
  const subject = `Order Update — Your order is ${status}`;

  const messages = {
    processing: "Your order is being carefully prepared by our pharmacy team.",
    shipped: "Great news! Your order is on its way. Expected: 2-3 business days.",
    delivered: "Your order has been delivered. We hope you're feeling better soon! 🙏",
    cancelled: "Your order has been cancelled. Any online payment will be refunded in 5-7 business days."
  };

  const message = messages[status] || `Your order status has been updated to ${status}.`;

  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Hi ${name},</h2>
    <p style="margin:0 0 24px;color:#475569;line-height:1.6;font-size:16px;">
      ${message}
    </p>
    
    <div style="text-align:center;margin-bottom:24px;">
      <div style="background:#f1f5f9;padding:8px 16px;border-radius:6px;display:inline-block;
                  color:#64748b;font-weight:600;font-size:14px;">
        Order #${orderId.toString().toUpperCase()}
      </div>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" 
         style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;
                border-radius:6px;text-decoration:none;font-weight:600;">
        View Order
      </a>
    </div>
  `;

  return sendEmail(email, subject, htmlEmailWrapper(body));
};

// ── 4. Prescription Status Email ─────────────────────────────────────────────
export const sendPrescriptionStatusEmail = async (email, name, status, notes = "") => {
  const isApproved = status === "approved";
  const subject = isApproved
    ? "✅ Prescription Approved — MedStore"
    : "Prescription Update Required — MedStore";

  const body = isApproved ? `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;
                  width:64px;height:64px;background:#dcfce7;border-radius:50%;color:#16a34a;font-size:32px;">
        ✓
      </div>
    </div>
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;text-align:center;">Prescription Approved</h2>
    <p style="margin:0 0 24px;color:#475569;text-align:center;line-height:1.6;">
      Your prescription has been verified by our pharmacist. You can now proceed with your order.
    </p>
    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop" 
         style="display:inline-block;background:#16a34a;color:#ffffff;padding:12px 24px;
                border-radius:6px;text-decoration:none;font-weight:600;">
        Shop Now
      </a>
    </div>
  ` : `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;
                  width:64px;height:64px;background:#ffedd5;border-radius:50%;color:#ea580c;font-size:32px;">
        !
      </div>
    </div>
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;text-align:center;">Action Required</h2>
    <p style="margin:0 0 24px;color:#475569;text-align:center;line-height:1.6;">
      We couldn't approve your prescription. Please review the reason below and upload a new copy.
    </p>
    
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#b91c1c;font-weight:700;font-size:12px;text-transform:uppercase;">Reason</p>
      <p style="margin:0;color:#7f1d1d;">${notes || 'Image clarity issue'}</p>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/upload-prescription" 
         style="display:inline-block;background:#ea580c;color:#ffffff;padding:12px 24px;
                border-radius:6px;text-decoration:none;font-weight:600;">
        Upload Again
      </a>
    </div>
  `;

  return sendEmail(email, subject, htmlEmailWrapper(body));
};

// Legacy support for older controller calls
export const sendPrescriptionStatus = async (user, prescription, status, notes) => {
  return sendPrescriptionStatusEmail(user.email, user.name, status, notes);
};

// ── 5. Password Reset Email ──────────────────────────────────────────────────
export const sendPasswordResetEmail = async (user, resetUrl) => {
  const subject = "Reset Your MedStore Password";
  const { name, email } = user;

  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Hi ${name},</h2>
    <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
      We received a request to reset your password. Click the button below to choose a new one.
    </p>
    
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" 
         style="display:inline-block;background:#4f46e5;color:#ffffff;padding:14px 32px;
                border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">
        Reset Password
      </a>
    </div>

    <div style="background:#f8fafc;padding:16px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <p style="margin:0;color:#64748b;font-size:13px;">
        Link expires in 1 hour. If you didn't request this, simply ignore this email — your account is safe.
      </p>
    </div>
    
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      Trouble clicking? Copy this link:<br>
      <a href="${resetUrl}" style="color:#4f46e5;text-decoration:none;">${resetUrl}</a>
    </p>
  `;

  return sendEmail(email, subject, htmlEmailWrapper(body));
};

// ── 6. Low Stock Alert Email ─────────────────────────────────────────────────
export const sendLowStockAlert = async (medicines) => {
  const subject = `⚠️ Stock Alert — ${medicines.length} medicines need restocking`;
  const email = process.env.EMAIL_USER;

  if (!email) {
    console.warn("Low stock alert skipped: EMAIL_USER not configured.");
    return { success: false };
  }

  const rows = medicines.map(med => {
    const isOutOfStock = med.stock === 0;
    const bg = isOutOfStock ? '#fef2f2' : '#fffbeb';
    const color = isOutOfStock ? '#b91c1c' : '#b45309';

    return `
      <tr style="background:${bg};">
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#1f2937;">
          <strong>${med.name}</strong>
        </td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:#4b5563;">
          ${med.brand}
        </td>
        <td style="padding:12px;border-bottom:1px solid #e5e7eb;color:${color};font-weight:700;text-align:center;">
          ${med.stock}
        </td>
      </tr>
    `;
  }).join('');

  const body = `
    <h2 style="margin:0 0 16px;color:#b91c1c;font-size:20px;">⚠️ Stock Alert</h2>
    <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
      The following medicines are running low or out of stock and need immediate attention:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <thead style="background:#f9fafb;">
        <tr>
          <th style="padding:12px;text-align:left;color:#6b7280;font-size:12px;text-transform:uppercase;">Medicine</th>
          <th style="padding:12px;text-align:left;color:#6b7280;font-size:12px;text-transform:uppercase;">Brand</th>
          <th style="padding:12px;text-align:center;color:#6b7280;font-size:12px;text-transform:uppercase;">Stock</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/medicines" 
         style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;
                border-radius:6px;text-decoration:none;font-weight:600;">
        Go to Admin Panel
      </a>
    </div>
  `;

  return sendEmail(email, subject, htmlEmailWrapper(body));
};

export const sendTicketConfirmationEmail = async (email, name, ticketId, subject) => {
  const emailSubject = `We received your query — Ticket #${ticketId}`;

  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Hi ${name},</h2>
    <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
      We've received your support request. Our team usually responds within 24 hours.
    </p>

    <div style="margin-bottom:24px;">
      <span style="background:#f1f5f9;color:#64748b;padding:6px 12px;border-radius:4px;font-size:14px;font-weight:600;border:1px solid #e2e8f0;">
        Ticket #${ticketId}
      </span>
    </div>

    <div style="background:#fff;border:1px solid #e2e8f0;border-left:4px solid #3b82f6;border-radius:6px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;color:#334155;font-weight:500;">${subject}</p>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/support" 
         style="display:inline-block;background:#3b82f6;color:#ffffff;padding:12px 24px;
                border-radius:6px;text-decoration:none;font-weight:600;">
        View My Tickets
      </a>
    </div>
  `;

  return sendEmail(email, emailSubject, htmlEmailWrapper(body));
};

export const sendTicketReplyEmail = async (email, name, ticketId, subject, reply) => {
  const emailSubject = `Reply to your ticket #${ticketId} — MedStore Support`;

  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Hi ${name},</h2>
    <p style="margin:0 0 24px;color:#475569;line-height:1.6;">
      Our support team has replied to your query regarding "<strong>${subject}</strong>".
    </p>

    <div style="background:#eff6ff;border:1px solid #dbeafe;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:12px;color:#1e40af;font-weight:700;text-transform:uppercase;">Admin Reply</p>
      <p style="margin:0;color:#1e3a8a;line-height:1.6;">${reply}</p>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/support" 
         style="display:inline-block;background:#3b82f6;color:#ffffff;padding:12px 24px;
                border-radius:6px;text-decoration:none;font-weight:600;">
        View Full Conversation
      </a>
    </div>
  `;

  return sendEmail(email, emailSubject, htmlEmailWrapper(body));
};

// =====================================================
// NEW: Medicine Request Email Functions
// =====================================================

// ── 7. Medicine Request Status Update ───────────────────────────────────────
export const sendRequestStatusEmail = async (email, name, medicineName, status, notes = "") => {
  const subject = `Medicine Request ${status} — MedStore`;

  const statusMessages = {
    approved: {
      title: "✅ Medicine Request Approved",
      message: `Good news! Your request for "${medicineName}" has been approved. We're working on sourcing it for you.`,
      button: "Track Request",
      buttonUrl: "/my-requests"
    },
    rejected: {
      title: "ℹ️ Medicine Request Update",
      message: `We're unable to fulfill your request for "${medicineName}" at this time. Please see the reason below.`,
      button: "Request Another",
      buttonUrl: "/request-medicine"
    },
    available: {
      title: "🎉 Medicine Now Available!",
      message: `Great news! "${medicineName}" is now available in our store. You can order it right away.`,
      button: "Order Now",
      buttonUrl: "/shop"
    },
    ordered: {
      title: "📦 Medicine Ordered",
      message: `Your requested medicine "${medicineName}" has been ordered. You'll receive updates soon.`,
      button: "View Orders",
      buttonUrl: "/orders"
    }
  };

  const config = statusMessages[status] || {
    title: "Medicine Request Update",
    message: `Your request for "${medicineName}" has been updated to: ${status}`,
    button: "View Requests",
    buttonUrl: "/my-requests"
  };

  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Hi ${name},</h2>
    <div style="margin-bottom:24px;">
      <h3 style="margin:0 0 8px;color:#2563eb;font-size:18px;">${config.title}</h3>
      <p style="margin:0;color:#475569;line-height:1.6;">${config.message}</p>
    </div>

    ${notes ? `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:600;">Admin Notes</p>
      <p style="margin:0;color:#334155;">${notes}</p>
    </div>
    ` : ''}

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}${config.buttonUrl}" 
         style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;
                border-radius:6px;text-decoration:none;font-weight:600;">
        ${config.button}
      </a>
    </div>
  `;

  return sendEmail(email, subject, htmlEmailWrapper(body));
};

// ── 8. Notify Admin of New Request ───────────────────────────────────────────
export const notifyAdminNewRequest = async (request) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  
  if (!adminEmail) {
    console.warn("Admin email not configured - skipping notification");
    return { success: false };
  }

  const subject = `📦 New Medicine Request: ${request.medicineName}`;
  
  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">New Medicine Request</h2>
    
    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="8">
        <tr>
          <td style="color:#64748b;font-weight:600;">Medicine:</td>
          <td style="color:#1e293b;">${request.medicineName}</td>
        </tr>
        ${request.manufacturer ? `
        <tr>
          <td style="color:#64748b;font-weight:600;">Manufacturer:</td>
          <td style="color:#1e293b;">${request.manufacturer}</td>
        </tr>` : ''}
        ${request.dosage ? `
        <tr>
          <td style="color:#64748b;font-weight:600;">Dosage:</td>
          <td style="color:#1e293b;">${request.dosage}</td>
        </tr>` : ''}
        <tr>
          <td style="color:#64748b;font-weight:600;">Quantity:</td>
          <td style="color:#1e293b;">${request.quantity}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-weight:600;">Requested by:</td>
          <td style="color:#1e293b;">${request.user?.name} (${request.user?.email})</td>
        </tr>
        ${request.purpose ? `
        <tr>
          <td style="color:#64748b;font-weight:600;">Purpose:</td>
          <td style="color:#1e293b;">${request.purpose}</td>
        </tr>` : ''}
      </table>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/medicine-requests" 
         style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;
                border-radius:6px;text-decoration:none;font-weight:600;">
        View Request
      </a>
    </div>
  `;

  return sendEmail(adminEmail, subject, htmlEmailWrapper(body));
};

export default {
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendOrderStatusEmail,
  sendPrescriptionStatusEmail,
  sendPrescriptionStatus,
  sendPasswordResetEmail,
  sendLowStockAlert,
  sendTicketConfirmationEmail,
  sendTicketReplyEmail,
  sendRequestStatusEmail,
  notifyAdminNewRequest,
};