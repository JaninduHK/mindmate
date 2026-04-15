import 'dotenv/config'; // Must be first — loads .env before any other module reads process.env
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server } from 'socket.io';

import { socketHandler } from './socket/socketHandler.js';
import chatRoutes from './routes/chat.routes.js';

import connectDB from './config/database.js';
import { configureCloudinary } from './config/cloudinary.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { RATE_LIMIT_CONFIG } from './config/constants.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import counselorRoutes from './routes/counselor.routes.js';
import peerSupporterRoutes from './routes/peerSupporter.routes.js';
import eventRoutes from './routes/event.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import adminRoutes from './routes/admin.routes.js';
import withdrawalRoutes from './routes/withdrawal.routes.js';
import moodRoutes from './routes/moodRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import personalTrackingAnalyticsRoutes from './routes/analyticsRoutes.js';
import moodConfigRoutes from './routes/moodConfig.routes.js';
import guardianRoutes from './routes/guardian.routes.js';
import emergencyContactRoutes from './routes/emergencyContact.routes.js';

// Initialize Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Configure Cloudinary
configureCloudinary();


// ===============================
// CORS CONFIGURATION
// ===============================
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow if the origin is in our list
    if (allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin))) {
      return callback(null, true);
    }

    // Block if not in the list
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
};


// ===============================
// SOCKET.IO SETUP
// ===============================
const io = new Server(server, {
  cors: corsOptions,
});

// Initialize socket events
socketHandler(io);


// ===============================
// GLOBAL RATE LIMITER
// ===============================
const globalLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
});


// ===============================
// MIDDLEWARE STACK
// ===============================
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS

// Stripe webhook must come BEFORE JSON parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(compression());
app.use(globalLimiter);


// Logging only in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}


// ===============================
// HEALTH CHECK
// ===============================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});


// ===============================
// API ROUTES
// ===============================
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/counselors', counselorRoutes);
app.use('/api/counselor', counselorRoutes);
app.use('/api/peer-supporters', peerSupporterRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/personal-tracking/moods', moodRoutes);
// Alias for Progress 1 frontend delete requirement
app.use('/api/moods', moodRoutes);
app.use('/api/personal-tracking/goals', goalRoutes);
app.use('/api/personal-tracking/analytics', personalTrackingAnalyticsRoutes);
app.use('/api/mood-config', moodConfigRoutes);
app.use('/api/guardian', guardianRoutes);
app.use('/api/emergency-contacts', emergencyContactRoutes);


// ===============================
// 404 HANDLER
// ===============================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});


// ===============================
// GLOBAL ERROR HANDLER
// ===============================
app.use(errorMiddleware);


// ===============================
// START SERVER AFTER DB CONNECT
// ===============================
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health\n`);
  });
});


// ===============================
// GLOBAL ERROR EVENTS
// ===============================
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  if (process.env.NODE_ENV === 'production') process.exit(1);
});