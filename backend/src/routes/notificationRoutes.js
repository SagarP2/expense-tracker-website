const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markRead,
    markAllRead,
    deleteAllNotifications,
    deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const asyncHandler = require('../utils/asyncHandler');

router.use(protect);

router.route('/').get(asyncHandler(getNotifications));
router.patch('/read-all',asyncHandler(markAllRead));
router.patch('/:id/read',asyncHandler(markRead));
router.delete('/delete-all',asyncHandler(deleteAllNotifications));
router.delete('/:id',asyncHandler(deleteNotification));

// Test queue (lazy import to avoid Redis init on startup)
router.post('/queue-test',asyncHandler(async (req,res) => {
    const { enqueueNotification } = require('../queues/notificationProducer');
    await enqueueNotification('TEST_NOTIFICATION',req.body);
    res.status(202).json({ message: 'Notification enqueued' });
}));

module.exports = router;
