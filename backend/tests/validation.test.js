const request = require('supertest');
const express = require('express');
const validate = require('../src/middleware/validate');
const { z } = require('zod');

const app = express();
app.use(express.json());

const schema = z.object({
    body: z.object({
        name: z.string().min(2),
    }),
});

app.post('/test-validation',validate(schema),(req,res) => {
    res.status(200).json({ status: 'ok' });
});

describe('Validation Middleware',() => {
    it('should pass valid requests',async () => {
        const res = await request(app)
            .post('/test-validation')
            .send({ name: 'ValidName' });
        expect(res.statusCode).toEqual(200);
    });

    it('should fail invalid requests',async () => {
        const res = await request(app)
            .post('/test-validation')
            .send({ name: 'A' }); // Too short
        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toEqual('Validation Error');
        expect(res.body.details).toHaveLength(1);
    });
});
