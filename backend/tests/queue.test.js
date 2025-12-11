const request = require('supertest');
const express = require('express');
const { notificationQueue } = require('../src/queues/notificationProducer');

// Mock auth middleware
jest.mock('../src/middleware/authMiddleware',() => ({
    protect: (req,res,next) => {
        req.user = { id: 'testuser' };
        next();
    }
}));

// We need to load the actual router, but it depends on controllers which depend on models.
// To avoid complex mocking, we will test the producer directly or mock the app.
// Let's test the producer logic essentially.

const { enqueueNotification } = require('../src/queues/notificationProducer');

describe('Queue Producer',() => {
    beforeAll(async () => {
        // Cleanup
        await notificationQueue.drain();
    });

    afterAll(async () => {
        await notificationQueue.close();
    });

    it('should enqueue a job',async () => {
        await enqueueNotification('TEST_JOB',{ foo: 'bar' });

        const counts = await notificationQueue.getJobCounts('wait','active','delayed');
        // We expect at least 1 job in wait or active
        expect(counts.wait + counts.active).toBeGreaterThanOrEqual(1);
    });
});
