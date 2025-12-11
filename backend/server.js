const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const collabRoutes = require('./src/routes/collabRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Load environment variables
dotenv.config({ path: path.join(__dirname,'.env') });

// Verify critical env vars are loaded
console.log('🔧 Environment check:',{
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS ? '****' + process.env.SMTP_PASS.slice(-4) : 'NOT SET'
});

connectDB();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const { initSentry,Sentry } = require('./src/utils/sentry');
initSentry(app);
const server = http.createServer(app);

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL
].filter(Boolean);

const io = new Server(server,{
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

// Store io instance in app to use in controllers/services
app.set('io',io);
global.io = io;

// Socket.IO Middleware for Authentication
io.use(async (socket,next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: Token required'));
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        socket.user = { id: decoded.id };
        next();
    } catch (error) {
        next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection',(socket) => {
    console.log('🔌 New client connected:',socket.id);

    // Auto-join user room
    if (socket.user && socket.user.id) {
        const roomName = `user:${socket.user.id}`;
        socket.join(roomName);
        console.log(`👤 User ${socket.user.id} joined room ${roomName} (Socket: ${socket.id})`);
    }

    socket.on('disconnect',() => {
        console.log('❌ Client disconnected:',socket.id);
    });
});

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(mongoSanitize());
app.use(require('./src/middleware/requestId'));
app.use(require('./src/middleware/metrics'));

const { globalLimiter } = require('./src/middleware/rateLimit');
app.use('/api',globalLimiter);

app.use(express.json());

// Routes
app.use('/',require('./src/routes/health')); // Mounts /health and /ready at root
app.get('/metrics',async (req,res) => {
    res.set('Content-Type',require('./src/metrics/metrics').register.contentType);
    res.end(await require('./src/metrics/metrics').register.metrics());
});
app.use('/api/auth',authRoutes);
app.use('/api/transactions',transactionRoutes);
app.use('/api/collab',collabRoutes);
app.use('/api/users',userRoutes);
app.use('/api/notifications',require('./src/routes/notificationRoutes'));

// Error handling middleware
if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
}
const errorHandler = require('./src/middleware/errorHandler');

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let serverInstance;

// Only listen if this file is run directly (not imported)
if (require.main === module) {
    serverInstance = server.listen(PORT,() => console.log(`Server running on port ${PORT}`));
}

// Graceful Shutdown
const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully');
    if (serverInstance) {
        serverInstance.close(() => {
            console.log('Closed out remaining connections');
            const mongoose = require('mongoose');
            mongoose.connection.close(false,() => {
                console.log('MongoDb connection closed');
                process.exit(0);
            });
        });
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM',gracefulShutdown);
process.on('SIGINT',gracefulShutdown);

module.exports = { app,server,io };

