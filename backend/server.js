import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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

// CORS config
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

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

// Base route for server diagnostics
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'EarlyEdge MERN API running smoothly',
    timestamp: new Date()
  });
});

// Configure Socket.io server
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Bind socket connection actions
handleSquadSocket(io);

// Expose Socket.io server instance context to express REST routes
app.set('socketio', io);

// Static frontend build asset serving (for production deployment context)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

// Connect to MongoDB Database
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/earlyedge';
console.log('⏳ Connecting to MongoDB...');

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    
    // Boot up Express server listening
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 EarlyEdge MERN Backend active on port ${PORT}`);
      console.log(`📡 CORS policy allows access from origin: ${allowedOrigin}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB database connection error:', error.message);
    process.exit(1);
  });
