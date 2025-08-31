import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, XCircle, Info, X, AlertTriangle } from 'lucide-react'

const Toast = ({ message, type = 'info', duration = 5000, onClose, action, persistent = false }) => {
  const [isVisible, setIsVisible] = useState(true)
  const [timeLeft, setTimeLeft] = useState(duration)

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  }

  const colors = {
    success: 'bg-green-500 text-white border-green-600',
    error: 'bg-red-500 text-white border-red-600',
    warning: 'bg-yellow-500 text-white border-yellow-600',
    info: 'bg-blue-500 text-white border-blue-600'
  }

  const Icon = icons[type]

  useEffect(() => {
    if (duration > 0 && !persistent) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 100) {
            setIsVisible(false)
            setTimeout(onClose, 300)
            return 0
          }
          return prev - 100
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [duration, onClose, persistent])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const handleAction = () => {
    if (action?.onClick) {
      action.onClick()
    }
    handleClose()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className={`${colors[type]} px-6 py-4 rounded-lg shadow-lg max-w-sm border-l-4 backdrop-blur-sm`}
        >
          <div className="flex items-start space-x-3">
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium leading-relaxed">{message}</p>
              
              {action && (
                <button
                  onClick={handleAction}
                  className="mt-2 text-xs underline hover:no-underline transition-all"
                >
                  {action.label}
                </button>
              )}
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Progress Bar */}
          {!persistent && duration > 0 && (
            <div className="mt-3 w-full bg-white/20 rounded-full h-1">
              <motion.div
                className="bg-white h-1 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / duration) * 100}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Enhanced Toast container with queue management
export const ToastContainer = () => {
  const [toasts, setToasts] = useState([])
  const maxToasts = 5

  const addToast = (message, type = 'info', options = {}) => {
    const { duration = 5000, action, persistent = false } = options
    const id = Date.now() + Math.random()
    const newToast = { id, message, type, duration, action, persistent }
    
    setToasts(prev => {
      const updated = [...prev, newToast]
      // Keep only the most recent toasts
      return updated.slice(-maxToasts)
    })

    // Auto-remove old toasts if queue is full
    if (toasts.length >= maxToasts) {
      const oldestToast = toasts[0]
      if (oldestToast && !oldestToast.persistent) {
        removeToast(oldestToast.id)
      }
    }
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAllToasts = () => {
    setToasts([])
  }

  // Enhanced global toast functions
  useEffect(() => {
    window.showToast = addToast
    window.clearToasts = clearAllToasts
    
    // Enhanced toast methods
    window.toast = {
      success: (message, options) => addToast(message, 'success', options),
      error: (message, options) => addToast(message, 'error', { ...options, duration: 8000 }),
      warning: (message, options) => addToast(message, 'warning', options),
      info: (message, options) => addToast(message, 'info', options),
      persistent: (message, type = 'info') => addToast(message, type, { persistent: true })
    }
  }, [toasts.length])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            action={toast.action}
            persistent={toast.persistent}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
      
      {/* Clear All Button */}
      {toasts.length > 1 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={clearAllToasts}
          className="w-full text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-2"
        >
          Clear All ({toasts.length})
        </motion.button>
      )}
    </div>
  )
}

export default Toast