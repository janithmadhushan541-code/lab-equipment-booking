export function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
}
export function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}
