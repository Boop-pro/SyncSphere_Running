import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import prisma from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import teamRoutes from './src/routes/teamRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import calendarRoutes from './src/routes/calendarRoutes.js';
import meetingRoutes from './src/routes/meetingRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import discussionRoutes from './src/routes/discussionRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { startReminderScheduler } from './src/utils/reminderScheduler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Cross-Origin Resource Sharing (CORS) with Credentials
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // Allows HTTP-only session cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
  })
);

// 2. Body Parsing & Cookie Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. Static File Serving for File Attachments
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. API Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SyncSphere Backend API',
  });
});

// 5. Route Mounts
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/discussions', discussionRoutes);
app.use('/api/v1/reports', reportRoutes);

// 6. Centralized Error Handling Middleware
app.use(errorHandler);

// 7. Start Server & Background Schedulers
const server = app.listen(PORT, () => {
  console.log('==================================================');
  console.log(` SyncSphere Backend running on http://localhost:${PORT}`);
  console.log(` Client URL configured: ${CLIENT_URL}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('==================================================');

  // Start background reminder scheduler
  startReminderScheduler();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down SyncSphere server...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database connections closed. Exiting process.');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\nProcess terminated. Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default app;
