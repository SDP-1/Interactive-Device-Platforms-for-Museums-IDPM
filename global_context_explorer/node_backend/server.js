require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const config = require('./config/config');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cityRoutes = require('./routes/cities');
const eventRoutes = require('./routes/events');
const influenceRoutes = require('./routes/influences');
const districtMuseumRoutes = require('./routes/districtMuseums');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}

// Static uploads (for event images)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/influences', influenceRoutes);
app.use('/api/district-museums', districtMuseumRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: config.nodeEnv === 'development' ? err.message : 'Server error',
    });
});

const PORT = config.port;
const server = app.listen(PORT, () => {
    console.log(`[${new Date().toLocaleTimeString()}] [Server] Running on port ${PORT} (${config.nodeEnv})`);
});

process.on('unhandledRejection', (err, promise) => {
    console.error(`[Unhandled Rejection] Error: ${err.message}`);
});

process.on('uncaughtException', (err) => {
    console.error(`[Uncaught Exception] Error: ${err.message}`);
});

module.exports = app;
