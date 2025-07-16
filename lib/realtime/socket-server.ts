import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { NextApiRequest } from 'next'
import { v4 as uuidv4 } from 'uuid'
import { RedisStateManager } from './redis-state-manager'
import { SupabaseRealtimeManager } from './supabase-realtime-manager'

export interface SocketAuthData {
  userId: string
  projectId?: string
  sessionId: string
}

export interface ViberSession {
  id: string
  userId: string
  projectId: string
  status: 'active' | 'paused' | 'completed' | 'error'
  currentTask: string
  progress: number
  createdAt: Date
  lastActivity: Date
}

export class ContexterSocketServer {
  private io: SocketIOServer
  private redisManager: RedisStateManager
  private supabaseRealtime: SupabaseRealtimeManager
  private activeSessions: Map<string, ViberSession> = new Map()

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    this.redisManager = new RedisStateManager()
    this.supabaseRealtime = new SupabaseRealtimeManager()
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`)

      // Authentication
      socket.on('authenticate', async (authData: SocketAuthData) => {
        try {
          await this.authenticateSocket(socket, authData)
          socket.emit('authenticated', { success: true, sessionId: authData.sessionId })
        } catch (error) {
          socket.emit('authentication_error', { error: 'Authentication failed' })
          socket.disconnect()
        }
      })

      // Context Composer Events
      socket.on('context:update', async (data) => {
        await this.handleContextUpdate(socket, data)
      })

      socket.on('context:save', async (data) => {
        await this.handleContextSave(socket, data)
      })

      // Viber AI Agent Events
      socket.on('viber:start_session', async (data) => {
        await this.handleViberStart(socket, data)
      })

      socket.on('viber:pause_session', async (data) => {
        await this.handleViberPause(socket, data)
      })

      socket.on('viber:resume_session', async (data) => {
        await this.handleViberResume(socket, data)
      })

      socket.on('viber:stop_session', async (data) => {
        await this.handleViberStop(socket, data)
      })

      socket.on('viber:user_approval', async (data) => {
        await this.handleUserApproval(socket, data)
      })

      // Visual Observer Events
      socket.on('visual:capture_request', async (data) => {
        await this.handleVisualCapture(socket, data)
      })

      socket.on('visual:state_changed', async (data) => {
        await this.handleVisualStateChange(socket, data)
      })

      // Error Fixer Events
      socket.on('error:detected', async (data) => {
        await this.handleErrorDetected(socket, data)
      })

      socket.on('error:fixed', async (data) => {
        await this.handleErrorFixed(socket, data)
      })

      // Progress Events
      socket.on('progress:request_update', async (data) => {
        await this.handleProgressUpdate(socket, data)
      })

      // Settings Events
      socket.on('settings:update', async (data) => {
        await this.handleSettingsUpdate(socket, data)
      })

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`)
        this.handleDisconnect(socket)
      })
    })
  }

  // Authentication Methods
  private async authenticateSocket(socket: any, authData: SocketAuthData) {
    // Verify user token with Supabase
    const isValid = await this.supabaseRealtime.verifyUser(authData.userId)
    if (!isValid) {
      throw new Error('Invalid user authentication')
    }

    // Store user session in Redis
    await this.redisManager.setUserSession(socket.id, authData)
    
    // Join user-specific room
    socket.join(`user:${authData.userId}`)
    
    if (authData.projectId) {
      socket.join(`project:${authData.projectId}`)
    }
  }

  // Context Composer Event Handlers
  private async handleContextUpdate(socket: any, data: any) {
    const session = await this.redisManager.getUserSession(socket.id)
    if (!session) return

    // Broadcast context update to all clients in project room
    socket.to(`project:${data.projectId}`).emit('context:updated', {
      projectId: data.projectId,
      context: data.context,
      updatedBy: session.userId,
      timestamp: new Date()
    })

    // Store in Redis for persistence
    await this.redisManager.updateProjectContext(data.projectId, data.context)
  }

  private async handleContextSave(socket: any, data: any) {
    const session = await this.redisManager.getUserSession(socket.id)
    if (!session) return

    // Save context to Supabase
    await this.supabaseRealtime.saveProjectContext(data.projectId, data.context)
    
    socket.emit('context:saved', { 
      success: true, 
      projectId: data.projectId,
      timestamp: new Date()
    })
  }

  // Viber AI Agent Event Handlers
  private async handleViberStart(socket: any, data: any) {
    const session = await this.redisManager.getUserSession(socket.id)
    if (!session) return

    const viberSession: ViberSession = {
      id: uuidv4(),
      userId: session.userId,
      projectId: data.projectId,
      status: 'active',
      currentTask: 'Initializing development session',
      progress: 0,
      createdAt: new Date(),
      lastActivity: new Date()
    }

    this.activeSessions.set(viberSession.id, viberSession)
    await this.redisManager.setViberSession(viberSession.id, viberSession)

    // Notify all project participants
    this.io.to(`project:${data.projectId}`).emit('viber:session_started', {
      sessionId: viberSession.id,
      status: viberSession.status,
      timestamp: new Date()
    })

    // Start the actual Viber AI process (will be implemented later)
    this.startViberProcess(viberSession)
  }

  private async handleViberPause(socket: any, data: any) {
    const viberSession = this.activeSessions.get(data.sessionId)
    if (!viberSession) return

    viberSession.status = 'paused'
    viberSession.lastActivity = new Date()
    
    await this.redisManager.setViberSession(data.sessionId, viberSession)
    
    this.io.to(`project:${viberSession.projectId}`).emit('viber:session_paused', {
      sessionId: data.sessionId,
      timestamp: new Date()
    })
  }

  private async handleViberResume(socket: any, data: any) {
    const viberSession = this.activeSessions.get(data.sessionId)
    if (!viberSession) return

    viberSession.status = 'active'
    viberSession.lastActivity = new Date()
    
    await this.redisManager.setViberSession(data.sessionId, viberSession)
    
    this.io.to(`project:${viberSession.projectId}`).emit('viber:session_resumed', {
      sessionId: data.sessionId,
      timestamp: new Date()
    })
  }

  private async handleViberStop(socket: any, data: any) {
    const viberSession = this.activeSessions.get(data.sessionId)
    if (!viberSession) return

    viberSession.status = 'completed'
    viberSession.lastActivity = new Date()
    
    await this.redisManager.setViberSession(data.sessionId, viberSession)
    this.activeSessions.delete(data.sessionId)
    
    this.io.to(`project:${viberSession.projectId}`).emit('viber:session_stopped', {
      sessionId: data.sessionId,
      finalProgress: viberSession.progress,
      timestamp: new Date()
    })
  }

  private async handleUserApproval(socket: any, data: any) {
    const session = await this.redisManager.getUserSession(socket.id)
    if (!session) return

    // Store user approval decision
    await this.redisManager.setUserApproval(data.sessionId, data.approved, data.feedback)
    
    // Notify Viber AI Agent
    this.io.to(`viber:${data.sessionId}`).emit('viber:user_response', {
      approved: data.approved,
      feedback: data.feedback,
      timestamp: new Date()
    })
  }

  // Visual Observer Event Handlers
  private async handleVisualCapture(socket: any, data: any) {
    // Request visual capture from Visual Observer
    this.io.to(`visual:${data.projectId}`).emit('visual:capture_requested', {
      requestId: data.requestId,
      url: data.url,
      timestamp: new Date()
    })
  }

  private async handleVisualStateChange(socket: any, data: any) {
    // Broadcast visual state change to interested parties
    this.io.to(`project:${data.projectId}`).emit('visual:state_changed', {
      projectId: data.projectId,
      changes: data.changes,
      screenshot: data.screenshot,
      timestamp: new Date()
    })

    // Store visual state in Redis
    await this.redisManager.updateVisualState(data.projectId, data.changes)
  }

  // Error Fixer Event Handlers
  private async handleErrorDetected(socket: any, data: any) {
    // Broadcast error detection
    this.io.to(`project:${data.projectId}`).emit('error:detected', {
      projectId: data.projectId,
      error: data.error,
      severity: data.severity,
      timestamp: new Date()
    })

    // Trigger automatic error fixing
    this.io.to(`error-fixer:${data.projectId}`).emit('error:fix_request', {
      errorId: data.errorId,
      error: data.error,
      codeContext: data.codeContext
    })
  }

  private async handleErrorFixed(socket: any, data: any) {
    // Broadcast error resolution
    this.io.to(`project:${data.projectId}`).emit('error:fixed', {
      projectId: data.projectId,
      errorId: data.errorId,
      fix: data.fix,
      timestamp: new Date()
    })
  }

  // Progress Event Handlers
  private async handleProgressUpdate(socket: any, data: any) {
    const progress = await this.redisManager.getProjectProgress(data.projectId)
    
    socket.emit('progress:updated', {
      projectId: data.projectId,
      progress: progress,
      timestamp: new Date()
    })
  }

  // Settings Event Handlers
  private async handleSettingsUpdate(socket: any, data: any) {
    const session = await this.redisManager.getUserSession(socket.id)
    if (!session) return

    await this.redisManager.updateUserSettings(session.userId, data.settings)
    
    socket.emit('settings:updated', {
      success: true,
      settings: data.settings,
      timestamp: new Date()
    })
  }

  // Disconnect Handler
  private async handleDisconnect(socket: any) {
    const session = await this.redisManager.getUserSession(socket.id)
    if (session) {
      await this.redisManager.removeUserSession(socket.id)
    }
  }

  // Viber Process Management
  private async startViberProcess(viberSession: ViberSession) {
    // This will be implemented when we build the AI agents
    console.log(`Starting Viber process for session: ${viberSession.id}`)
    // TODO: Initialize Viber AI Agent
  }

  // Utility Methods
  public broadcastToProject(projectId: string, event: string, data: any) {
    this.io.to(`project:${projectId}`).emit(event, data)
  }

  public broadcastToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data)
  }

  public getActiveSessionsCount(): number {
    return this.activeSessions.size
  }

  public getSessionDetails(sessionId: string): ViberSession | undefined {
    return this.activeSessions.get(sessionId)
  }
} 