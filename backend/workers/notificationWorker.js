const { Worker } = require('bullmq');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const IORedis = require('ioredis');

// Load environment variables
dotenv.config({ path: path.join(__dirname,'../.env') });

// Mock DB connection if needed or real one
const connectDB = require('../src/config/db');

// Connect to DB for worker
if (process.env.MONGO_URI) {
    connectDB();
}

// Create Redis connection with robust retry strategy
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(redisUrl,{
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
        // Stop retrying after 3 attempts if we can't connect
        if (times > 3) {
            console.warn(`[Worker] Redis connection failed after ${times} attempts. Worker will be disabled.`);
            return null;
        }
        return Math.min(times * 100,2000);
    }
});

// Suppress unhandled error logs for ECONNREFUSED to prevent console spam
connection.on('error',(err) => {
    if (err.code !== 'ECONNREFUSED') {
        console.error('[Worker] Redis error:',err);
    }
});

let worker;

try {
    worker = new Worker('email-notifications',async job => {
        console.log(`Processing job ${job.id} of type ${job.name}`);
        console.log('Payload:',job.data);

        // Simulate work: e.g., saving to DB, sending email
        // await sendEmail(job.data);
        // await Notification.create({...});

        // For now just success
        return { status: 'sent',sentAt: new Date() };
    },{
        connection
    });

    worker.on('completed',job => {
        console.log(`Job ${job.id} completed! Result:`,job.returnvalue);
    });

    worker.on('failed',(job,err) => {
        console.log(`Job ${job.id} failed with ${err.message}`);
    });

    console.log('Worker started for email-notifications queue...');

} catch (error) {
    console.error('[Worker] Failed to start worker:',error);
}
