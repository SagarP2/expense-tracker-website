const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        const errors = err.errors ? err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        })) : [{ message: err.message }];

        return res.status(400).json({
            error: 'Validation Error',
            details: errors,
        });
    }
};

module.exports = validate;
