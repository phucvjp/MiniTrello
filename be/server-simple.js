require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

console.log('🚀 Starting Mini Trello Backend...\n');

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

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Make io available to all routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Mini Trello API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working!',
    socketConnected: io.engine.clientsCount || 0
  });
});

// Import and use routes only if they work
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.log('❌ Auth routes failed:', error.message);
}

try {
  const boardRoutes = require('./routes/boards');
  app.use('/api/boards', boardRoutes);
  console.log('✅ Board routes loaded');
} catch (error) {
  console.log('❌ Board routes failed:', error.message);
}

try {
  const cardRoutes = require('./routes/cards');
  app.use('/api/cards', cardRoutes);
  console.log('✅ Card routes loaded');
} catch (error) {
  console.log('❌ Card routes failed:', error.message);
}

try {
  const taskRoutes = require('./routes/tasks');
  app.use('/api/tasks', taskRoutes);
  console.log('✅ Task routes loaded');
} catch (error) {
  console.log('❌ Task routes failed:', error.message);
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Join board room
  socket.on('join-board', (boardId) => {
    socket.join(`board:${boardId}`);
    console.log(`🏠 User ${socket.id} joined board ${boardId}`);
  });

  // Leave board room
  socket.on('leave-board', (boardId) => {
    socket.leave(`board:${boardId}`);
    console.log(`👋 User ${socket.id} left board ${boardId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/health',
      'GET /api/test',
      'POST /api/auth/signup',
      'POST /api/auth/signin',
      'GET /api/auth/me',
      'GET /api/boards',
      'POST /api/boards',
      'GET /api/cards',
      'POST /api/cards',
      'GET /api/tasks',
      'POST /api/tasks'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🎉 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌐 API available at: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
