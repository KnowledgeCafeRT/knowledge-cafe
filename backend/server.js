const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const ordersRouter = require('./routes/orders');
const usersRouter = require('./routes/users');
const pfandRouter = require('./routes/pfand');
const notificationsRouter = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/pfand', pfandRouter);
app.use('/api/notifications', notificationsRouter);

// Serve static files (for the frontend)
app.use(express.static('../'));

// Serve the internal display
app.get('/display', (req, res) => {
  res.sendFile('display.html', { root: '../' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Knowledge Cafe Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 Internal display: http://localhost:${PORT}/display`);
  console.log(`🌐 Frontend: http://localhost:${PORT}/`);
  console.log('');
  console.log('📋 Available API endpoints:');
  console.log('  GET    /api/orders           - Get all orders');
  console.log('  POST   /api/orders           - Create new order');
  console.log('  PATCH  /api/orders/:id/status - Update order status');
  console.log('  GET    /api/orders/user/:id  - Get user orders');
  console.log('  POST   /api/users            - Create/update user');
  console.log('  GET    /api/users/email/:email - Get user by email');
  console.log('  PATCH  /api/users/:id        - Update user profile');
  console.log('  GET    /api/users/:id/pfand  - Get user Pfand data');
  console.log('  GET    /api/users/:id/favorites - Get user favorites');
  console.log('  POST   /api/users/:id/favorites - Add favorite');
  console.log('  DELETE /api/users/:id/favorites/:itemId - Remove favorite');
  console.log('  POST   /api/pfand/return     - Process Pfand return');
  console.log('  GET    /api/pfand/outstanding - Get outstanding Pfand');
  console.log('  GET    /api/pfand/stats      - Get Pfand statistics');
  console.log('  POST   /api/notifications/subscribe - Subscribe to notifications');
  console.log('  DELETE /api/notifications/unsubscribe - Unsubscribe');
  console.log('  GET    /api/notifications/vapid-key - Get VAPID key');
  console.log('  POST   /api/notifications/test - Send test notification');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
