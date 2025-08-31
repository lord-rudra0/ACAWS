export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Default error
  let error = {
    success: false,
    message: err.message || 'Server Error'
  }

  // PostgreSQL errors
  if (err.code === '23505') {
    error.message = 'Duplicate field value entered'
    error.statusCode = 400
  }

  if (err.code === '23503') {
    error.message = 'Foreign key constraint violation'
    error.statusCode = 400
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token'
    error.statusCode = 401
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired'
    error.statusCode = 401
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(val => val.message).join(', ')
    error.statusCode = 400
  }

  res.status(error.statusCode || 500).json(error)
}

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export const validateRequest = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)))

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    next()
  }
}