const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');

router.get('/protected-example',protect,(req,res) => {
    res.status(200).json({
        message: 'This is a protected route',
        user: req.user
    });
});

module.exports = router;
