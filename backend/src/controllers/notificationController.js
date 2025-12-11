const Notification = require('../models/Notification');

// Get all notifications for user
exports.getNotifications = async (req,res) => {
    // req.user is guaranteed by protect middleware

    const notifications = await Notification.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(50); // Limit to last 50 notifications

    const unreadCount = await Notification.countDocuments({
        userId: req.user.id,
        isRead: false
    });

    res.json({ notifications,unreadCount });
};

// Mark notification as read
exports.markRead = async (req,res) => {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
        { _id: id,userId: req.user.id },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    res.json(notification);
};

// Mark all as read
exports.markAllRead = async (req,res) => {
    await Notification.updateMany(
        { userId: req.user.id,isRead: false },
        { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
};

// Delete all notifications
exports.deleteAllNotifications = async (req,res) => {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ message: 'All notifications deleted' });
};

// Delete single notification
exports.deleteNotification = async (req,res) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.id
    });

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    res.json({ message: 'Notification deleted' });
};

