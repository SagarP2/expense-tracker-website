const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/health',(req,res) => {
    // Check DB status
    const dbStatus = mongoose.connection.readyState === 1 ? 'ok' : 'disconnected';
    // Check Redis (if available globally or import cache check)
    // For now simplistic
    res.json({
        status: 'ok',
        services: {
            db: dbStatus,
        }
    });
});

router.get('/ready',(req,res) => {
    if (mongoose.connection.readyState === 1) {
        res.json({ status: 'ok' });
    } else {
        res.status(503).json({ status: 'not ready' });
    }
});

module.exports = router;
