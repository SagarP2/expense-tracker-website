const errorHandler = (err,req,res,next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;

    // If status code is 200 but there is an error, set it to 500
    const finalStatus = statusCode === 200 ? 500 : statusCode;

    res.status(finalStatus);

    res.json({
        success: false,
        message: err.message,
        error: err.message, // standardized for some frontend consumers
        code: err.code || 'SERVER_ERROR',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };
