import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sanitize from 'mongo-sanitize';

// Route Imports
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import squadRoutes from './routes/squads.js';
import assessmentRoutes from './routes/assessments.js';
import aiRoutes from './routes/ai.js';
import practiceRoutes from './routes/practice.js';

// Socket Import
import { handleSquadSocket } from './sockets/squadSocket.js';

// Setup environment configurations
dotenv.config();

// Ensure critical env variables are defined
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET environment variable is not defined!');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by'); // Hide Express signature header
app.use(helmet({
  contentSecurityPolicy: false // Allow FontAwesome/Google Font CDNs to load freely
}));

const server = http.createServer(app);

// CORS config - Support local dev, custom CLIENT_URL, and all Vercel domains
const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(u => u.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow non-browser requests (mobile, server-to-server, health checks)
  if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) return true;
  // Automatically allow any Vercel production or preview deployment (*.vercel.app)
  if (origin.endsWith('.vercel.app')) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

// Middlewares - Increase json size limit to support Base64 resume uploads!
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb', parameterLimit: 50000 }));

// Global rate limiter: max 500 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// Strict authentication rate limiter: max 30 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Global middleware to sanitize incoming payloads against NoSQL injection
app.use((req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
});

// Setup API route endpoints
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/squads', squadRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/practice', practiceRoutes);

// Base route for server diagnostics and Render health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'EarlyEdge API',
    version: '1.0.0',
    timestamp: new Date()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Configure Socket.io server
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) callback(null, true);
      else callback(new Error(`Socket CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Bind socket connection actions
handleSquadSocket(io);

// Expose Socket.io server instance context to express REST routes
app.set('socketio', io);

// Static frontend build asset serving (fallback if deployed as a monolith)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
const indexHtmlPath = path.join(frontendDistPath, 'index.html');

if (process.env.NODE_ENV === 'production' && fs.existsSync(indexHtmlPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(indexHtmlPath);
  });
}

// Connect to MongoDB Database (supports both MONGODB_URI and MONGO_URI)
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/earlyedge';
console.log('⏳ Connecting to MongoDB...');

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    
    // Boot up Express server listening
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 EarlyEdge MERN Backend active on port ${PORT}`);
      console.log(`📡 Allowed client origins: ${configuredOrigins.join(', ')}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB database connection error:', error.message);
    process.exit(1);
  });
