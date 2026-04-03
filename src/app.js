const express = require('express');
const cors = require('cors');

const authRoutes = require('./routers/auth.routes');
const userRoutes = require('./routers/user.routers');
const recordRoutes = require('./routers/record.routes');
const categoryRoutes = require('./routers/category.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Register API routes
app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/users', userRoutes);

app.use('/api/v1/records', recordRoutes);

app.use('/api/v1/categories', categoryRoutes);


// Global Error Handler
app.use((err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message
    });
  }


  // Log unexpected errors internally
  console.error('Unhandled Exception:', err);

  // Send generic response
  return res.status(500).json({
    success: false,
    message: 'Something went wrong.'
  });
});

module.exports = app;