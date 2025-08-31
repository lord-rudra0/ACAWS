import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get user from database
    const userDoc = await User.findById(decoded.userId)
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    req.user = userDoc.toJSON()
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      })
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }
    
    console.error('Auth middleware error:', error)
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    })
  }
}

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }

    next()
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return next()
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    const userDoc = await User.findById(decoded.userId)
    if (userDoc) {
      req.user = userDoc.toJSON()
    }

    next()
  } catch (error) {
    // Silently continue without authentication
    next()
  }
}