const path = require('path');

// Load environment variables first, before importing other modules
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('./config/passport');
const http = require('http');
const socketIo = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const cardRoutes = require('./routes/cards');
const taskRoutes = require('./routes/tasks');
// const userRoutes = require('./routes/users'); // TODO: Create user routes
// const githubRoutes = require('./routes/github'); // TODO: Create GitHub integration routes

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration for OAuth
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Make io available to all routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/tasks', taskRoutes);
// app.use('/api/users', userRoutes); // TODO: Create user routes
// app.use('/api/github', githubRoutes); // TODO: Create GitHub integration routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Mini Trello API is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join board room
  socket.on('join-board', (boardId) => {
    socket.join(`board-${boardId}`);
    console.log(`User ${socket.id} joined board ${boardId}`);
  });

  // Leave board room
  socket.on('leave-board', (boardId) => {
    socket.leave(`board-${boardId}`);
    console.log(`User ${socket.id} left board ${boardId}`);
  });

  // Real-time updates for boards
  socket.on('board-updated', (data) => {
    socket.to(`board-${data.boardId}`).emit('board-updated', data);
  });

  // Real-time updates for cards
  socket.on('card-updated', (data) => {
    socket.to(`board-${data.boardId}`).emit('card-updated', data);
  });

  // Real-time updates for tasks
  socket.on('task-updated', (data) => {
    socket.to(`board-${data.boardId}`).emit('task-updated', data);
  });

  // Handle drag and drop updates
  socket.on('task-moved', (data) => {
    socket.to(`board-${data.boardId}`).emit('task-moved', data);
  });

  // Handle user typing indicators
  socket.on('user-typing', (data) => {
    socket.to(`board-${data.boardId}`).emit('user-typing', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Mini Trello Backend Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Make io available to routes
app.set('io', io);

module.exports = app;
