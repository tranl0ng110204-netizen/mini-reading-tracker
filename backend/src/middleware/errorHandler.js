const errorHandler = (err, req, res, next) => {
  console.error('[Error]:', err.message || err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || [];

  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

export default errorHandler;
