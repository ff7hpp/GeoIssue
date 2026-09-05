import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { config } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import categoriesRouter from './modules/categories/categories.routes.js';
import issuesRouter from './modules/issues/issues.routes.js';
import reportsRouter from './modules/reports/reports.routes.js';
import usersRouter from './modules/users/users.routes.js';
import supportRouter from './modules/support/support.routes.js';
import commentsRouter from './modules/comments/comments.routes.js';
import geocodeRouter from './modules/geocoding/geocode.routes.js';
import adminRouter from './modules/admin/admin.routes.js';
import authRouter from './modules/auth/auth.routes.js';
import { isUsingMockDb } from './db/pool.js';

export const app = express();

// Security & Parsing Middlewares
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: config.clientOrigins,
    credentials: true,
  })
);
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.nodeEnv === 'production' ? 200 : 1000,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    data: {
      status: 'healthy',
      database: isUsingMockDb ? 'memory' : 'postgresql',
      timestamp: new Date().toISOString(),
      service: 'GeoIssue API',
      version: '1.0.0',
    },
  });
});

// Domain Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/issues/:id/support', supportRouter);
app.use('/api/issues/:id/comments', commentsRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api', usersRouter); // mounts /api/me, /api/me/sync, /api/me/reports
app.use('/api/geocode', geocodeRouter);
app.use('/api/admin', adminRouter);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Global Error Handler
app.use(errorHandler);
