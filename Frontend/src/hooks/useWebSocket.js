import { useState, useEffect, useRef, useCallback } from 'react'

export const useWebSocket = (url, options = {}) => {
  // Use a ref for the raw WebSocket instance to avoid rerenders and callback churn
  const socketRef = useRef(null)
  const [lastMessage, setLastMessage] = useState(null)
  const [readyState, setReadyState] = useState(WebSocket.CONNECTING)
  const [error, setError] = useState(null)
  const [connectionHistory, setConnectionHistory] = useState([])
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const heartbeatIntervalRef = useRef(null)
  const isConnectingRef = useRef(false)
  const lastConnectTimeRef = useRef(0)
  const maxReconnectAttempts = options.maxReconnectAttempts || 5
  const reconnectInterval = options.reconnectInterval || 3000
  const heartbeatInterval = options.heartbeatInterval || 30000

  const logConnection = useCallback((event, details = {}) => {
    const logEntry = {
      event,
      timestamp: new Date().toISOString(),
      attempt: reconnectAttempts.current,
      ...details
    }
    
    setConnectionHistory(prev => [...prev.slice(-9), logEntry]) // Keep last 10 entries
    console.log(`WebSocket ${event}:`, logEntry)
  }, [])

  const startHeartbeat = useCallback((ws) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }

    heartbeatIntervalRef.current = setInterval(() => {
      const activeSocket = ws || socketRef.current
      if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
        try {
          activeSocket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
        } catch (error) {
          console.error('Heartbeat failed:', error)
        }
      }
    }, heartbeatInterval)
  }, [heartbeatInterval])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    // Prevent rapid repeated connect attempts
    const now = Date.now()
    if (now - lastConnectTimeRef.current < 500) {
      logConnection('connect_rate_limited', { sinceLast: now - lastConnectTimeRef.current })
      return
    }
    lastConnectTimeRef.current = now

    // Avoid re-entrance if a connect is already in progress
    if (isConnectingRef.current) {
      logConnection('connect_skipped_already_connecting')
      return
    }
    isConnectingRef.current = true

    // If a socket exists and is not closed, skip creating a new one
    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
      logConnection('connect_skipped_existing_socket', { readyState: socketRef.current.readyState })
      isConnectingRef.current = false
      return
    }
    try {
      logConnection('connecting', { url, attempt: reconnectAttempts.current + 1 })
      
      const ws = new WebSocket(url)
      
  ws.onopen = (event) => {
        setReadyState(WebSocket.OPEN)
        setError(null)
        reconnectAttempts.current = 0

        logConnection('connected', {
          readyState: ws.readyState,
          protocol: ws.protocol
        })

  // store the raw WebSocket on a ref to avoid rerenders
  socketRef.current = ws
  startHeartbeat(ws)
  isConnectingRef.current = false

        if (options.onOpen) options.onOpen(event)
      }

  ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle heartbeat responses
          if (data.type === 'pong') {
            logConnection('heartbeat', { latency: Date.now() - data.timestamp })
            return
          }
          
          setLastMessage({ ...data, receivedAt: new Date().toISOString() })
          
          logConnection('message_received', { 
            type: data.type,
            size: event.data.length 
          })
          
          if (options.onMessage) options.onMessage(data)
        } catch (parseError) {
          console.error('Failed to parse WebSocket message:', parseError)
          logConnection('parse_error', { 
            error: parseError.message,
            rawData: event.data.substring(0, 100) 
          })
        }
      }

      ws.onclose = (event) => {
        setReadyState(WebSocket.CLOSED)
        stopHeartbeat()

        logConnection('disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        })

        if (options.onClose) options.onClose(event)

        // Clear ref only when closed
  if (socketRef.current === ws) socketRef.current = null
  isConnectingRef.current = false

        // Attempt reconnection if not intentional and within retry limit
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = reconnectInterval * Math.pow(1.5, reconnectAttempts.current - 1) // Exponential backoff

          logConnection('reconnect_scheduled', {
            attempt: reconnectAttempts.current,
            delay: delay,
            maxAttempts: maxReconnectAttempts
          })

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError({
            type: 'connection_failed',
            message: 'Failed to establish stable connection after multiple attempts',
            attempts: reconnectAttempts.current
          })
        }
      }

  ws.onerror = (error) => {
        const errorMsg = 'WebSocket connection failed'
        setError({
          type: 'connection_error',
          message: errorMsg,
          timestamp: new Date().toISOString()
        })
        setReadyState(WebSocket.CLOSED)
        
        logConnection('error', { error: errorMsg })
        
  // clear connecting flag so user can retry
  isConnectingRef.current = false

        if (options.onError) options.onError(error)
      }

  // store reference (if not already stored in onopen)
  socketRef.current = ws
    } catch (connectionError) {
      const errorMsg = 'Failed to create WebSocket connection'
      setError({
        type: 'creation_error',
        message: errorMsg,
        details: connectionError.message
      })
      
      logConnection('creation_error', { error: connectionError.message })
      console.error('WebSocket creation failed:', connectionError)
    }
  }, [url, options, maxReconnectAttempts, reconnectInterval, logConnection, startHeartbeat, stopHeartbeat])

  const sendMessage = useCallback((message) => {
  const ws = socketRef.current
  if (ws && readyState === WebSocket.OPEN) {
      try {
        const messageWithId = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sentAt: new Date().toISOString()
        }
    ws.send(JSON.stringify(messageWithId))
        
        logConnection('message_sent', { 
          type: message.type,
          id: messageWithId.id,
          size: JSON.stringify(messageWithId).length 
        })
        
        return { success: true, messageId: messageWithId.id }
      } catch (sendError) {
        const errorMsg = 'Failed to send message'
        console.error(errorMsg, sendError)
        setError({
          type: 'send_error',
          message: errorMsg,
          details: sendError.message
        })
        
        logConnection('send_error', { error: sendError.message })
        return { success: false, error: errorMsg }
      }
    } else {
      const errorMsg = `WebSocket not connected (state: ${readyState})`
      console.warn(errorMsg)
      setError({
        type: 'not_connected',
        message: 'Connection not available',
        readyState
      })
      
      return { success: false, error: errorMsg }
    }
  }, [readyState, logConnection])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    stopHeartbeat()
    
    const ws = socketRef.current
    if (ws) {
      try {
        ws.close(1000, 'Intentional disconnect')
      } catch (e) {}
      socketRef.current = null
      logConnection('manual_disconnect')
    }
  }, [stopHeartbeat, logConnection])

  const forceReconnect = useCallback(() => {
    reconnectAttempts.current = 0
    setError(null)
    disconnect()
    setTimeout(connect, 1000)
  }, [connect, disconnect])

  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      logConnection('network_online')
      if (readyState === WebSocket.CLOSED && !error) {
        forceReconnect()
      }
    }

    const handleOffline = () => {
      logConnection('network_offline')
      setError({
        type: 'network_offline',
        message: 'Network connection lost'
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [readyState, error, forceReconnect, logConnection])

  return {
  socket: socketRef.current,
    lastMessage,
    readyState,
    error,
    connectionHistory,
    sendMessage,
    disconnect,
    reconnect: forceReconnect,
    isConnected: readyState === WebSocket.OPEN,
  isConnecting: Boolean(isConnectingRef.current || readyState === WebSocket.CONNECTING)
  }
}

export default useWebSocket