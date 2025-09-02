import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react'

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showStatus, setShowStatus] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState('good')
  const [lastOfflineTime, setLastOfflineTime] = useState(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      
      // Show reconnection message
      if (lastOfflineTime) {
        const offlineDuration = Date.now() - lastOfflineTime
        if (window.toast) {
          window.toast.success(
            `Connection restored after ${Math.round(offlineDuration / 1000)}s`,
            { duration: 3000 }
          )
        }
        setLastOfflineTime(null)
      }
      
      // Hide status after 3 seconds
      setTimeout(() => setShowStatus(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
      setLastOfflineTime(Date.now())
      
      if (window.toast) {
        window.toast.error(
          'Connection lost. Some features may not work properly.',
          { persistent: true }
        )
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Test connection quality periodically
    const qualityInterval = setInterval(testConnectionQuality, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(qualityInterval)
    }
  }, [lastOfflineTime])

  const testConnectionQuality = async () => {
    if (!navigator.onLine) return

    try {
      const startTime = Date.now()
      const API_BASE = import.meta.env.VITE_API_URL || ''
      const healthUrl = API_BASE ? `${API_BASE.replace(/\/$/, '')}/health` : '/api/health'
      // Use GET for wider compatibility; some servers disallow HEAD
      const response = await fetch(healthUrl, {
        method: 'GET',
        cache: 'no-cache'
      })
      const latency = Date.now() - startTime

      if (response.ok) {
        if (latency < 200) {
          setConnectionQuality('excellent')
        } else if (latency < 500) {
          setConnectionQuality('good')
        } else if (latency < 1000) {
          setConnectionQuality('fair')
        } else {
          setConnectionQuality('poor')
        }
      } else {
        setConnectionQuality('poor')
      }
    } catch (error) {
      setConnectionQuality('poor')
    }
  }

  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500'
      case 'good': return 'text-blue-500'
      case 'fair': return 'text-yellow-500'
      case 'poor': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const retryConnection = () => {
    window.location.reload()
  }

  if (!showStatus && isOnline) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-20 right-4 z-40 ${
          isOnline 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        } px-4 py-3 rounded-lg shadow-lg max-w-sm`}
      >
        <div className="flex items-center space-x-3">
          {isOnline ? (
            <Wifi className="w-5 h-5" />
          ) : (
            <WifiOff className="w-5 h-5" />
          )}
          
          <div className="flex-1">
            <p className="font-medium text-sm">
              {isOnline ? 'Connection Restored' : 'Connection Lost'}
            </p>
            {isOnline && (
              <p className="text-xs opacity-90">
                Quality: <span className={getQualityColor()}>{connectionQuality}</span>
              </p>
            )}
          </div>

          {!isOnline && (
            <button
              onClick={retryConnection}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Retry connection"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {!isOnline && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <p className="text-xs opacity-90">
              • Camera analysis will continue offline
            </p>
            <p className="text-xs opacity-90">
              • Data will sync when connection returns
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default NetworkStatus