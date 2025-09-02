import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Import routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import learningRoutes from './routes/learning.js'
import tutorRoutes from './routes/tutor.js'
import wellnessRoutes from './routes/wellness.js'
import analyticsRoutes from './routes/analytics.js'
import communityRoutes from './routes/community.js'
import adminRoutes from './routes/admin.js'
import aiRoutes from './routes/ai.js'
import pythonProxyRoutes from './routes/pythonProxy.js'

// Import middleware
import { authenticateToken } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'

// Import database connection
import { connectDB } from './config/mongodb.js'

dotenv.config()

const app = express()
const server = createServer(app)
const corsOriginsEnv = process.env.EXPRESS_CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173'
const corsOriginsArr = corsOriginsEnv.split(',').map(o => o.trim()).filter(Boolean)

const io = new Server(server, {
  cors: {
    origin: corsOriginsArr,
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 3001

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || corsOriginsArr.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(limiter)

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🔌 Health check request received for Express backend')
  res.status(200).json({
    status: 'healthy',
    service: 'ACAWS Express Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', authenticateToken, userRoutes)
app.use('/api/learning', authenticateToken, learningRoutes)
app.use('/api/tutor', authenticateToken, tutorRoutes)
app.use('/api/wellness', wellnessRoutes) // Temporarily removed auth for development
app.use('/api/analytics', authenticateToken, analyticsRoutes)
app.use('/api/community', authenticateToken, communityRoutes)
app.use('/api/admin', authenticateToken, adminRoutes)
app.use('/api/ai', authenticateToken, aiRoutes)
// Python backend proxy (no auth middleware; proxy injects token from header/cookie)
app.use('/api/python', pythonProxyRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join_room', (roomId) => {
    socket.join(roomId)
    console.log(`User ${socket.id} joined room ${roomId}`)
  })

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId)
    console.log(`User ${socket.id} left room ${roomId}`)
  })

  socket.on('emotion_update', (data) => {
    // Broadcast emotion updates to relevant rooms
    socket.to(data.roomId).emit('emotion_received', data)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    const db = await connectDB()
    
    // Set up MongoDB connection events
    db.on('error', (error) => {
      console.error('MongoDB connection error:', error)
    })
    
    db.once('open', () => {
      console.log('MongoDB connection established successfully')
    })
    
    // Start server
    const PORT = process.env.PORT || 3001
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  server.close(() => {
    console.log('Process terminated')
    process.exit(0)
  })
})

export default app