/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, _next) {
  console.error('❌ Error:', err.message);

  // Don't leak stack traces in production
  const isDev = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
}
