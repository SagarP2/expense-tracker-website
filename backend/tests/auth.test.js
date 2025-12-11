const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { protect } = require('../src/middleware/auth');

const app = express();
app.use(express.json());
app.get('/test-auth',protect,(req,res) => {
    res.status(200).json({ user: req.user });
});

describe('Auth Middleware',() => {
    let token;

    beforeAll(() => {
        process.env.JWT_SECRET = 'testsecret';
        token = jwt.sign({ id: 'user123' },process.env.JWT_SECRET,{ expiresIn: '1h' });
    });

    it('should return 401 if no token is provided',async () => {
        const res = await request(app).get('/test-auth');
        expect(res.statusCode).toEqual(401);
        expect(res.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 if token is invalid',async () => {
        const res = await request(app)
            .get('/test-auth')
            .set('Authorization','Bearer invalidtoken');
        expect(res.statusCode).toEqual(401);
        expect(res.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 200 and user payload if token is valid',async () => {
        const res = await request(app)
            .get('/test-auth')
            .set('Authorization',`Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.user).toHaveProperty('id','user123');
    });
});
