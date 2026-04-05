const express = require('express');
const cors = require('cors');

const { startCleanupJob } = require('./utils/tokenBlacklist');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const recordRoutes = require('./routes/record.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const bulkRecordRoutes = require('./routes/bulk-record.routes');
const authenticate = require('./middleware/authenticate');
const requirePasswordChange = require('./middleware/requirePasswordChange');
const setupSwagger = require('./utils/swagger');

const app = express();

app.use(cors());
app.use(express.json());

setupSwagger(app);

// start blacklist cleanup job
startCleanupJob();

app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/users', authenticate, requirePasswordChange, userRoutes);
app.use('/api/v1/records', authenticate, requirePasswordChange, recordRoutes);
app.use('/api/v1/bulk-records', authenticate, requirePasswordChange, bulkRecordRoutes);
app.use('/api/v1/dashboard', authenticate, requirePasswordChange, dashboardRoutes);

// global error handler
app.use((err, req, res, next) => {
  if (err.isOperational) {
    const body = {
      success: false,
      message: err.message
    };
    // Include field-level errors when present (set by parseRequest utility)
    if (err.errors && err.errors.length > 0) {
      body.errors = err.errors;
    }
    return res.status(err.statusCode || 400).json(body);
  }

  // Log unexpected errors internally
  console.error('Unhandled Exception:', err);

  // Send generic response
  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again.'
  });
});

module.exports = app;