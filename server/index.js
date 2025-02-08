require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const http = require('http');
const socketIo = require('socket.io');
const auth = require('./middleware/auth');
const jwt = require('jsonwebtoken');

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const messageRoutes = require('./routes/message');
const userRoutes = require('./routes/user');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create Socket.io server
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Verify token function
async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.email
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    const decoded = await verifyToken(token);
    socket.user = decoded;
    console.log('Socket authenticated:', {
      socketId: socket.id,
      userId: decoded.userId,
      room: socket.rooms
    });
    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication failed'));
  }
});

// Socket connection handler with logging
io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Load chat handlers
require('./socket/chatHandlers')(io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', auth, chatRoutes); 
app.use('/api/messages', auth, messageRoutes);
app.use('/api/users', auth, userRoutes);

// Basic test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Log the error but don't exit the process in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', err);
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Log the error but don't exit the process in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', err);
  } else {
    process.exit(1);
  }
});