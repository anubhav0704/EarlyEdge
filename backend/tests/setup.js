import mongoose from 'mongoose';
import express from 'express';
import { createRequire } from 'module';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

// Load .env so JWT_SECRET, GROQ_API_KEY etc. are available in tests
dotenv.config();

const require = createRequire(import.meta.url);

// ── Test DB ──────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/earlyedge_test';

export async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }
}

export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

export async function closeDB() {
  await mongoose.connection.close();
}

// ── Shared Express app for integration tests ──────────────────────────────────
// We build a minimal clone of server.js without the live listen() call.
export async function buildTestApp() {
  // Lazy imports so env is already loaded before module code runs
  const { default: authRoutes }       = await import('../routes/auth.js');
  const { default: jobRoutes }        = await import('../routes/jobs.js');
  const { default: squadRoutes }      = await import('../routes/squads.js');
  const { default: assessmentRoutes } = await import('../routes/assessments.js');
  const { default: aiRoutes }         = await import('../routes/ai.js');

  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/squads', squadRoutes);
  app.use('/api/assessments', assessmentRoutes);
  app.use('/api/ai', aiRoutes);

  app.get('/', (_req, res) => res.json({ status: 'test-ok' }));
  return app;
}
