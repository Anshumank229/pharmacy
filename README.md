<p align="center">
  <h1 align="center">💊 MedStore</h1>
  <p align="center">
    A full-stack medicine delivery e-commerce platform built with the MERN stack.
    <br />
    Secure payments · Prescription management · Admin dashboard · Real-time stock tracking
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Razorpay-Integrated-0C2451?logo=razorpay&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" />
</p>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [Docker Deployment](#-docker-deployment)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🛒 Customer Features
- **Medicine Browsing** — Search, filter, and browse medicines with category-based navigation
- **Smart Cart** — Add/update/remove items with real-time stock validation
- **Wishlist** — Save medicines for later purchase
- **Secure Checkout** — Cash on Delivery (COD) and Razorpay online payment
- **Order Tracking** — View order history, status updates, and order details
- **Prescription Upload** — Upload prescriptions for regulated medicines (image/PDF)
- **Medicine Requests** — Request medicines not listed in the catalog
- **Coupon System** — Apply discount coupons with per-user limits, first-time-only, and category restrictions
- **Product Reviews** — Rate and review purchased medicines
- **Support Tickets** — Create and track customer support requests
- **Profile Management** — Update profile, change password, manage addresses

### 🔐 Authentication & Security
- **Multi-Method Login** — Email/password, OTP (email/SMS/WhatsApp), Google OAuth
- **Dual JWT Strategy** — Short-lived access tokens (15 min) + long-lived refresh tokens (7 days)
- **HttpOnly Cookies** — XSS-safe token storage with `Secure` and `SameSite=Strict` flags
- **Admin 2FA** — TOTP-based two-factor authentication for admin accounts
- **Token Blacklisting** — Redis-backed logout invalidation
- **Account Suspension** — Admin can deactivate user accounts instantly
- **Password Reset** — Secure token-based email reset flow

### 👨‍💼 Admin Dashboard
- **Dashboard Analytics** — Revenue, orders, users, and low-stock alerts
- **User Management** — Create, update, delete, activate/deactivate users
- **Order Management** — View all orders, update statuses, process refunds
- **Medicine Management** — CRUD operations with image upload (Cloudinary/local)
- **Prescription Review** — Approve/reject uploaded prescriptions
- **Coupon Management** — Create and manage discount coupons with advanced rules
- **Support Tickets** — View and reply to customer support requests
- **Medicine Requests** — Review and process catalog addition requests
- **Low Stock Alerts** — Automated email alerts for out-of-stock medicines

### 💰 Payment System
- **Razorpay Integration** — Secure online payments with signature verification
- **Webhook Support** — Server-side payment confirmation (handles browser crashes/timeouts)
- **Timing-Safe HMAC** — Prevents signature side-channel attacks
- **Payment Failure Tracking** — Records failure codes and descriptions
- **Refund Processing** — Admin can issue full or partial refunds via Razorpay API
- **Idempotent Webhooks** — Prevents duplicate payment processing

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js 18+** | Runtime environment |
| **Express 4** | Web framework |
| **MongoDB + Mongoose 8** | Database + ODM |
| **Redis (ioredis)** | Token blacklisting, caching |
| **JWT (jsonwebtoken)** | Authentication |
| **Razorpay SDK** | Payment processing |
| **Multer** | File upload handling |
| **Cloudinary** | Cloud image storage (optional) |
| **Nodemailer** | Transactional emails |
| **Winston** | Structured logging |
| **Helmet** | Security HTTP headers |
| **express-rate-limit** | Rate limiting |
| **express-mongo-sanitize** | NoSQL injection prevention |
| **express-validator** | Input validation |
| **Speakeasy + QRCode** | TOTP 2FA |
| **Twilio** | SMS/WhatsApp OTP |
| **bcryptjs** | Password hashing |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite 7** | Build tool + dev server |
| **TailwindCSS 3** | Utility-first styling |
| **React Router 7** | Client-side routing |
| **Axios** | HTTP client with interceptors |
| **Recharts** | Admin analytics charts |
| **Lucide React** | Icon library |
| **React Hot Toast** | Toast notifications |

### DevOps & Testing
| Technology | Purpose |
|------------|---------|
| **Docker + Docker Compose** | Containerization |
| **Nginx** | Reverse proxy + static serving |
| **Jest 30** | Backend unit/integration tests |
| **Vitest 4** | Frontend unit tests |
| **Supertest** | API endpoint testing |
| **MongoDB Memory Server** | In-memory test database |

---

## 🏗 Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   React SPA  │────▶│  Express API │────▶│   MongoDB    │
│  (Vite PWA)  │     │   (REST)     │     │  (Mongoose)  │
└──────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────┴───────┐
                    │              │
              ┌─────▼─────┐ ┌─────▼─────┐
              │   Redis    │ │ Cloudinary │
              │ (Caching)  │ │ (Images)   │
              └───────────┘ └───────────┘
                    │
              ┌─────▼──────────────┐
              │ Razorpay · Twilio  │
              │ Nodemailer · Google│
              └────────────────────┘
```

**Key Design Decisions:**
- **MongoDB Transactions** — Order creation + stock deduction are atomic
- **Dual JWT Cookies** — Access token (15 min) on all paths, refresh token (7 days) restricted to `/api/auth/refresh`
- **Fail-Open Redis** — Redis errors never block auth; gracefully degrades
- **Cloudinary Optional** — Falls back to local `uploads/` in development
- **Fire-and-Forget Emails** — Email failures never block API responses

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0
- **MongoDB** (local, Atlas, or Docker)
- **Redis** (optional — for token blacklisting and caching)
- **npm** or **yarn**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/medstore.git
cd medstore

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# ─── Required ─────────────────────────────────────────
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/medstore
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long

# ─── JWT Tokens (recommended: separate secrets) ──────
ACCESS_TOKEN_SECRET=your-access-token-secret-32-chars
REFRESH_TOKEN_SECRET=your-refresh-token-secret-32-chars

# ─── Frontend URL (for CORS) ─────────────────────────
CLIENT_URL=http://localhost:5173

# ─── Razorpay Payment Gateway ────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# ─── Email Service (Gmail / SMTP) ────────────────────
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# ─── Cloudinary (optional — falls back to local) ─────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─── Redis (optional — for token blacklisting) ───────
REDIS_URL=redis://localhost:6379

# ─── Twilio (optional — for SMS/WhatsApp OTP) ────────
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# ─── Google OAuth (optional) ─────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

> **⚠️ Important:** Generate strong secrets for production:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 🏃 Running the Project

### Development Mode

```bash
# Terminal 1 — Start backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Start frontend (port 5173)
cd frontend
npm run dev
```

The app will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

### Create Admin User

```bash
cd backend
npm run create-admin
```

---

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services started:**
| Service | Port | Description |
|---------|------|-------------|
| `backend` | 5000 | Node.js API server |
| `frontend` | 80 | Nginx serving React build |
| `mongodb` | 27017 | MongoDB database |
| `redis` | 6379 | Redis cache |

### Nginx Configuration
The included `nginx.conf` handles:
- Static file serving for the React build
- API reverse proxy (`/api/*` → backend:5000)
- Upload file serving (`/uploads/*`)
- Gzip compression
- Security headers
- SPA fallback routing

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/register` | Public | Register new user |
| `POST` | `/api/auth/login` | Public | Login with email/password |
| `POST` | `/api/auth/logout` | Auth | Logout (blacklists token) |
| `POST` | `/api/auth/refresh` | Auth | Refresh access token |
| `GET` | `/api/auth/me` | Auth | Get current user profile |
| `PUT` | `/api/auth/profile` | Auth | Update profile |
| `PUT` | `/api/auth/change-password` | Auth | Change password |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset email |
| `POST` | `/api/auth/reset-password/:token` | Public | Reset password with token |

### OTP Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/otp/send-email` | Public | Send email OTP |
| `POST` | `/api/auth/otp/send-phone` | Public | Send SMS/WhatsApp OTP |
| `POST` | `/api/auth/otp/verify` | Public | Verify OTP and create session |
| `POST` | `/api/auth/otp/resend` | Public | Resend OTP |

### Medicines
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/medicines` | Public | List medicines (paginated, filterable) |
| `GET` | `/api/medicines/suggestions` | Public | Search suggestions |
| `GET` | `/api/medicines/:id` | Public | Get medicine details |
| `POST` | `/api/medicines` | Admin | Add new medicine |
| `PUT` | `/api/medicines/:id` | Admin | Update medicine |
| `DELETE` | `/api/medicines/:id` | Admin | Delete medicine |

### Cart
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/cart` | Auth | Get user's cart |
| `POST` | `/api/cart/add` | Auth | Add item to cart |
| `POST` | `/api/cart/update` | Auth | Update item quantity |
| `POST` | `/api/cart/remove` | Auth | Remove item from cart |
| `DELETE` | `/api/cart/clear` | Auth | Clear entire cart |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/orders` | Auth | Place new order |
| `GET` | `/api/orders/my-orders` | Auth | Get user's orders (paginated) |
| `GET` | `/api/orders/:id` | Auth | Get single order details |
| `PUT` | `/api/orders/:id/cancel` | Auth | Cancel own order |
| `GET` | `/api/orders` | Admin | Get all orders (paginated) |
| `PUT` | `/api/orders/:id/status` | Admin | Update order status |

### Payments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/payments/create-order` | Auth | Create Razorpay order |
| `POST` | `/api/payments/verify` | Auth | Verify payment signature |
| `GET` | `/api/payments/:orderId/status` | Auth | Get payment status |
| `POST` | `/api/payments/:orderId/failure` | Auth | Record payment failure |
| `POST` | `/api/payments/:orderId/refund` | Admin | Process refund |
| `POST` | `/api/payments/webhook` | Public | Razorpay webhook endpoint |

### Prescriptions
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/prescriptions` | Auth | Upload prescription |
| `GET` | `/api/prescriptions/my-prescriptions` | Auth | Get user's prescriptions |
| `GET` | `/api/prescriptions/:id/file` | Auth | Download prescription file |
| `DELETE` | `/api/prescriptions/:id` | Auth | Delete own prescription |
| `GET` | `/api/prescriptions/pending` | Admin | Get pending prescriptions |
| `GET` | `/api/prescriptions/all` | Admin | Get all prescriptions |
| `PUT` | `/api/prescriptions/:id` | Admin | Approve/reject prescription |

### Coupons
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/coupons/validate` | Auth | Validate coupon code |
| `GET` | `/api/coupons` | Admin | List all coupons |
| `POST` | `/api/coupons` | Admin | Create coupon |
| `PUT` | `/api/coupons/:id` | Admin | Update coupon |
| `DELETE` | `/api/coupons/:id` | Admin | Delete coupon |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/admin/stats` | Admin | Dashboard statistics |
| `GET` | `/api/admin/users` | Admin | All users (paginated) |
| `GET` | `/api/admin/users/:id` | Admin | Single user details |
| `POST` | `/api/admin/users` | Admin | Create user |
| `PUT` | `/api/admin/users/:id` | Admin | Update user |
| `DELETE` | `/api/admin/users/:id` | Admin | Delete user |
| `PATCH` | `/api/admin/users/:id/toggle` | Admin | Activate/deactivate user |
| `GET` | `/api/admin/orders` | Admin | All orders (paginated) |
| `GET` | `/api/admin/low-stock` | Admin | Low stock medicines |

---

## 📁 Project Structure

```
medstore/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, Redis, env validation
│   │   ├── controllers/     # Route handlers (17 controllers)
│   │   │   ├── authController.js
│   │   │   ├── orderController.js
│   │   │   ├── paymentController.js
│   │   │   ├── webhookController.js
│   │   │   ├── medicineController.js
│   │   │   ├── cartController.js
│   │   │   ├── couponController.js
│   │   │   ├── prescriptionController.js
│   │   │   ├── adminController.js
│   │   │   ├── supportController.js
│   │   │   └── ...
│   │   ├── middleware/       # Auth, rate limiting, upload, validation
│   │   ├── models/           # Mongoose schemas (11 models)
│   │   ├── routes/           # Express route definitions (16 routers)
│   │   ├── services/         # Email, Cloudinary, external services
│   │   ├── utils/            # Logger, token generation, cache
│   │   └── server.js         # Express app entry point
│   ├── scripts/              # Admin creation script
│   ├── uploads/              # Local file uploads (dev only)
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios client with interceptors
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React context (Auth)
│   │   ├── layouts/          # MainLayout, AdminLayout
│   │   ├── pages/            # 25 user pages + 9 admin pages
│   │   │   ├── Home.jsx
│   │   │   ├── Shop.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminOrders.jsx
│   │   │   │   ├── AdminUsers.jsx
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── App.jsx           # Route definitions
│   │   └── main.jsx          # React entry point
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml        # Multi-container orchestration
├── Dockerfile.backend        # Backend container
├── nginx.conf                # Reverse proxy + static serving
└── README.md
```

---

## 🔒 Security

MedStore implements defense-in-depth security:

| Layer | Implementation |
|-------|---------------|
| **Authentication** | Dual JWT (access + refresh) in HttpOnly, Secure, SameSite=Strict cookies |
| **Authorization** | Role-based access control (`user` / `admin`) |
| **Rate Limiting** | Global (100 req/15 min), Auth (10 req/15 min), OTP (5 req/hr) |
| **Input Validation** | `express-validator` on all mutation endpoints |
| **NoSQL Injection** | `express-mongo-sanitize` globally applied |
| **Security Headers** | Helmet with customized CSP (Razorpay + Cloudinary allowlisted) |
| **Payment Security** | Timing-safe HMAC signature verification + webhook idempotency |
| **File Uploads** | Dual mimetype + extension validation, size limits (5MB images, 10MB prescriptions) |
| **Error Handling** | Error messages sanitized in production (no stack traces or DB errors leaked) |
| **Token Management** | Redis-backed blacklisting on logout, fail-open for availability |
| **Password Storage** | bcrypt with salt rounds of 10 |
| **2FA** | TOTP-based for admin accounts (Speakeasy + QR codes) |
| **Data Protection** | Sensitive fields excluded from API responses (`otp`, `resetPasswordToken`, `twoFactorSecret`) |
| **Atomic Operations** | MongoDB transactions for order creation + stock deduction |

---

## 🧪 Testing

### Backend Tests (Jest)

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

Tests use **MongoDB Memory Server** for isolated, in-memory database testing.

### Frontend Tests (Vitest)

```bash
cd frontend

# Run all tests
npm test
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Commit** changes: `git commit -m 'Add my feature'`
4. **Push** to branch: `git push origin feature/my-feature`
5. **Open** a Pull Request

### Code Style
- Use `logger` instead of `console.log/error` in backend code
- Sanitize error messages in production (`isProd ? 'An error occurred' : error.message`)
- Always use `role === 'admin'` for authorization checks (never `isAdmin`)
- Paginate all list endpoints
- Use MongoDB transactions for multi-document operations

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  Built with ❤️ by <strong>MedStore Team</strong>
</p>
