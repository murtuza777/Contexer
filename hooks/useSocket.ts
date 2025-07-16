import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './useAuth'

export interface SocketContextData {
  socket: Socket | null
  isConnected: boolean
  isAuthenticated: boolean
  connect: () => void
  disconnect: () => void
  joinProject: (projectId: string) => void
  leaveProject: (projectId: string) => void
}

export function useSocket(): SocketContextData {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { user } = useAuth()
  const connectionAttempts = useRef(0)
  const maxRetries = 5

  const connect = () => {
    if (socket?.connected) return

    console.log('Connecting to Socket.io server...')
    
    const newSocket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      retries: maxRetries,
      autoConnect: true,
    })

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to Socket.io server:', newSocket.id)
      setIsConnected(true)
      connectionAttempts.current = 0
      
      // Authenticate if user is available
      if (user) {
        authenticateSocket(newSocket)
      }
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.io server:', reason)
      setIsConnected(false)
      setIsAuthenticated(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      connectionAttempts.current++
      
      if (connectionAttempts.current >= maxRetries) {
        console.error('Max connection attempts reached')
        newSocket.disconnect()
      }
    })

    // Authentication events
    newSocket.on('authenticated', (data) => {
      console.log('Socket authenticated successfully:', data)
      setIsAuthenticated(true)
    })

    newSocket.on('authentication_error', (error) => {
      console.error('Socket authentication failed:', error)
      setIsAuthenticated(false)
    })

    setSocket(newSocket)
  }

  const disconnect = () => {
    if (socket) {
      console.log('Disconnecting from Socket.io server...')
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
      setIsAuthenticated(false)
    }
  }

  const authenticateSocket = (socketInstance: Socket) => {
    if (!user) return

    const authData = {
      userId: user.id,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    socketInstance.emit('authenticate', authData)
  }

  const joinProject = (projectId: string) => {
    if (socket && isAuthenticated) {
      socket.emit('join_project', { projectId })
      console.log(`Joined project room: ${projectId}`)
    }
  }

  const leaveProject = (projectId: string) => {
    if (socket && isAuthenticated) {
      socket.emit('leave_project', { projectId })
      console.log(`Left project room: ${projectId}`)
    }
  }

  // Auto-connect when user is available
  useEffect(() => {
    if (user && !socket) {
      connect()
    } else if (!user && socket) {
      disconnect()
    }
  }, [user])

  // Auto-authenticate when socket connects and user is available
  useEffect(() => {
    if (socket && isConnected && user && !isAuthenticated) {
      authenticateSocket(socket)
    }
  }, [socket, isConnected, user, isAuthenticated])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.removeAllListeners()
        socket.disconnect()
      }
    }
  }, [])

  return {
    socket,
    isConnected,
    isAuthenticated,
    connect,
    disconnect,
    joinProject,
    leaveProject
  }
}

// Specific hooks for different features
export function useViberSocket() {
  const { socket, isAuthenticated } = useSocket()

  const startViberSession = (projectId: string, contextData: any) => {
    if (socket && isAuthenticated) {
      socket.emit('viber:start_session', { projectId, contextData })
    }
  }

  const pauseViberSession = (sessionId: string) => {
    if (socket && isAuthenticated) {
      socket.emit('viber:pause_session', { sessionId })
    }
  }

  const resumeViberSession = (sessionId: string) => {
    if (socket && isAuthenticated) {
      socket.emit('viber:resume_session', { sessionId })
    }
  }

  const stopViberSession = (sessionId: string) => {
    if (socket && isAuthenticated) {
      socket.emit('viber:stop_session', { sessionId })
    }
  }

  const sendUserApproval = (sessionId: string, approved: boolean, feedback?: string) => {
    if (socket && isAuthenticated) {
      socket.emit('viber:user_approval', { sessionId, approved, feedback })
    }
  }

  return {
    socket,
    isAuthenticated,
    startViberSession,
    pauseViberSession,
    resumeViberSession,
    stopViberSession,
    sendUserApproval
  }
}

export function useContextSocket() {
  const { socket, isAuthenticated } = useSocket()

  const updateContext = (projectId: string, context: any) => {
    if (socket && isAuthenticated) {
      socket.emit('context:update', { projectId, context })
    }
  }

  const saveContext = (projectId: string, context: any) => {
    if (socket && isAuthenticated) {
      socket.emit('context:save', { projectId, context })
    }
  }

  return {
    socket,
    isAuthenticated,
    updateContext,
    saveContext
  }
}

export function useVisualObserverSocket() {
  const { socket, isAuthenticated } = useSocket()

  const requestVisualCapture = (projectId: string, url: string) => {
    if (socket && isAuthenticated) {
      const requestId = `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      socket.emit('visual:capture_request', { projectId, url, requestId })
      return requestId
    }
    return null
  }

  const reportVisualStateChange = (projectId: string, changes: any, screenshot?: string) => {
    if (socket && isAuthenticated) {
      socket.emit('visual:state_changed', { projectId, changes, screenshot })
    }
  }

  return {
    socket,
    isAuthenticated,
    requestVisualCapture,
    reportVisualStateChange
  }
}

export function useErrorFixerSocket() {
  const { socket, isAuthenticated } = useSocket()

  const reportError = (projectId: string, error: any, severity: 'low' | 'medium' | 'high' | 'critical') => {
    if (socket && isAuthenticated) {
      const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      socket.emit('error:detected', { projectId, error, severity, errorId })
      return errorId
    }
    return null
  }

  const reportErrorFixed = (projectId: string, errorId: string, fix: any) => {
    if (socket && isAuthenticated) {
      socket.emit('error:fixed', { projectId, errorId, fix })
    }
  }

  return {
    socket,
    isAuthenticated,
    reportError,
    reportErrorFixed
  }
}

export function useProgressSocket() {
  const { socket, isAuthenticated } = useSocket()

  const requestProgressUpdate = (projectId: string) => {
    if (socket && isAuthenticated) {
      socket.emit('progress:request_update', { projectId })
    }
  }

  return {
    socket,
    isAuthenticated,
    requestProgressUpdate
  }
}

export function useSettingsSocket() {
  const { socket, isAuthenticated } = useSocket()

  const updateSettings = (settings: any) => {
    if (socket && isAuthenticated) {
      socket.emit('settings:update', { settings })
    }
  }

  return {
    socket,
    isAuthenticated,
    updateSettings
  }
} 