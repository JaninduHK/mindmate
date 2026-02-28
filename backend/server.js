import 'dotenv/config'; // Must be first — loads .env before any other module reads process.env
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import connectDB from './config/database.js';
import { configureCloudinary } from './config/cloudinary.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { RATE_LIMIT_CONFIG } from './config/constants.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import counselorRoutes from './routes/counselor.routes.js';
import eventRoutes from './routes/event.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import adminRoutes from './routes/admin.routes.js';
import withdrawalRoutes from './routes/withdrawal.routes.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Configure Cloudinary
configureCloudinary();

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Global rate limiter (disabled in development)
const globalLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
});

// Middleware stack
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS

// Stripe webhook needs raw body — must come BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(compression()); // Compress responses
app.use(globalLimiter); // Rate limiting

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/counselors', counselorRoutes);
app.use('/api/counselor', counselorRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/withdrawals', withdrawalRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler (must be last)
app.use(errorMiddleware);

// Connect to DB then start server — ensures no queries fire before connection is ready
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health\n`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  if (process.env.NODE_ENV === 'production') process.exit(1);
});
