import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import User from '../models/User.js'

const router = express.Router()

// Register
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'educator', 'admin']).withMessage('Invalid role')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }

  const { name, email, password, role, institution } = req.body

  // Check if user already exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    })
  }

  // Hash password
  const salt = await bcrypt.genSalt(12)
  const hashedPassword = await bcrypt.hash(password, salt)

  // Create user
  const userDoc = new User({
    name,
    email,
    password: hashedPassword,
    role,
    institution
  })
  await userDoc.save()
  const user = userDoc.toJSON()

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  )

  // Set HttpOnly cookie for automatic auth in proxy
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution,
      created_at: user.created_at
    }
  })
}))

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }

  const { email, password } = req.body

  // Find user
  const userDoc = await User.findOne({ email })
  if (!userDoc) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    })
  }
  const user = userDoc.toJSON()

  // Check password
  const isPasswordValid = await bcrypt.compare(password, userDoc.password)
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    })
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  )

  // Update last login
  userDoc.last_login = new Date()
  await userDoc.save()

  // Set HttpOnly cookie for automatic auth in proxy
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution,
      created_at: user.created_at
    }
  })
}))

// Logout: clear cookie
router.post('/logout', async (req, res) => {
  try {
    res.clearCookie('token', { path: '/' })
    return res.json({ success: true, message: 'Logged out' })
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Logout failed' })
  }
})

// Get current user
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    const userDoc = await User.findById(decoded.userId)
    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      user: userDoc.toJSON()
    })
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    })
  }
}))

// Google OAuth login
router.post('/google', asyncHandler(async (req, res) => {
  const { tokenId } = req.body

  // Here you would verify the Google token
  // For now, we'll just return a placeholder response
  res.status(501).json({
    success: false,
    message: 'Google OAuth not implemented yet'
  })
}))

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
], asyncHandler(async (req, res) => {
  const { email } = req.body

  // Check if user exists
  const userDoc = await User.findOne({ email })
  if (!userDoc) {
    // Don't reveal if user exists
    return res.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent'
    })
  }

  // Generate reset token (implement email sending here)
  res.json({
    success: true,
    message: 'If an account exists with this email, a reset link has been sent'
  })
}))

export default router