# Migration & Rollback Guide

## 1. Environment Variables
Add these to your `backend/.env` file. If using Gmail, use an App Password.

```env
# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Expense Tracker <your-email@gmail.com>"

# Optional: If you want to simulate Socket.IO checks
# SOCKET_CORS_ORIGIN=http://localhost:5173
```

## 2. Cleanup (Redis/Bull)
The `bull` and `ioredis` packages are no longer used for notifications. You can safely remove them to reduce dependencies:

```bash
npm uninstall bull ioredis
# Check for any lingering redis containers in docker-compose if applicable
```

## 3. Rollback Plan
If you need to revert to the old queue-based system:

1.  Revert `src/services/notificationService.js` to its previous state (git checkout).
2.  Revert `src/controllers/collabController.js` to restore raw `createNotification` usages without the new helpers (git checkout).
3.  Ensure Redis is running.
