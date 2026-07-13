import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Route Imports
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import squadRoutes from './routes/squads.js';
import assessmentRoutes from './routes/assessments.js';

// Socket Import
import { handleSquadSocket } from './sockets/squadSocket.js';

// Setup environment configurations
dotenv.config();

const app = express();
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

// Setup API route endpoints
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/squads', squadRoutes);
app.use('/api/assessments', assessmentRoutes);

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
