import Redis from 'ioredis'
import { SocketAuthData, ViberSession } from './socket-server'

export interface ProjectContext {
  id: string
  title: string
  description: string
  techStack: string[]
  requirements: string[]
  userStories: string[]
  readme?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProjectProgress {
  projectId: string
  totalFeatures: number
  completedFeatures: number
  currentFeature: string
  percentage: number
  milestones: Milestone[]
  lastUpdated: Date
}

export interface Milestone {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  completedAt?: Date
}

export interface UserSettings {
  userId: string
  aiModel: string
  codeEditor: string
  theme: string
  notifications: boolean
  autoApproval: boolean
  extensions: string[]
  customPrompts: string[]
}

export interface VisualState {
  projectId: string
  lastScreenshot: string
  domChanges: any[]
  errorLogs: string[]
  performanceMetrics: any
  timestamp: Date
}

export class RedisStateManager {
  private redis: Redis
  private subscriber: Redis
  private publisher: Redis

  constructor() {
    // Use REDIS_URL if available (for cloud Redis like Upstash), otherwise use individual config
    const redisUrl = process.env.REDIS_URL
    
    let redisConfig: any
    
    if (redisUrl) {
      // Conservative configuration for cloud Redis (Upstash) stability
      redisConfig = {
        connectTimeout: 10000,
        commandTimeout: 5000,
        retryDelayOnFailover: 1000,
        retryDelayOnClusterDown: 1000,
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        lazyConnect: true,
        family: 4,
        keepAlive: 15000,
        // Stability optimizations for Upstash
        enableAutoPipelining: false,
        maxLoadingTime: 8000,
        enableOfflineQueue: true, // Enable for better stability
        // Conservative retry strategy
        retryStrategy: (times: number) => {
          if (times > 2) return null // Limit retries
          return Math.min(times * 1000, 3000)
        },
        // Limited reconnect to prevent loops
        reconnectOnError: (err: Error) => {
          return err.message.includes('READONLY')
        }
      }
    } else {
      // Use individual config for local Redis
      redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
      }
    }

    if (redisUrl) {
      this.redis = new Redis(redisUrl, redisConfig)
      this.subscriber = new Redis(redisUrl, redisConfig)
      this.publisher = new Redis(redisUrl, redisConfig)
    } else {
      this.redis = new Redis(redisConfig)
      this.subscriber = new Redis(redisConfig)
      this.publisher = new Redis(redisConfig)
    }

    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Main Redis connection events
    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })

    this.redis.on('ready', () => {
      console.log('✅ Redis ready for commands')
    })

    this.redis.on('error', (error) => {
      // Suppress common connection reset errors that are normal with cloud Redis
      if (error.message.includes('ECONNRESET') || 
          error.message.includes('Connection is closed') ||
          error.message.includes('read ECONNRESET')) {
        return // Silently ignore these expected errors
      }
      console.error('❌ Redis connection error:', error.message)
      // Don't throw error, let Redis handle reconnection
    })

    this.redis.on('close', () => {
      console.log('🔌 Redis connection closed')
    })

    this.redis.on('reconnecting', (ms: number) => {
      console.log(`🔄 Redis reconnecting in ${ms}ms...`)
    })

    this.redis.on('end', () => {
      console.log('🔚 Redis connection ended')
    })

    // Subscriber events
    this.subscriber.on('connect', () => {
      console.log('✅ Redis subscriber connected')
    })

    this.subscriber.on('error', (error) => {
      // Suppress common connection reset errors that are normal with cloud Redis
      if (error.message.includes('ECONNRESET') || 
          error.message.includes('Connection is closed') ||
          error.message.includes('read ECONNRESET')) {
        return // Silently ignore these expected errors
      }
      console.error('❌ Redis subscriber error:', error.message)
    })

    // Publisher events  
    this.publisher.on('connect', () => {
      console.log('✅ Redis publisher connected')
    })

    this.publisher.on('error', (error) => {
      // Suppress common connection reset errors that are normal with cloud Redis
      if (error.message.includes('ECONNRESET') || 
          error.message.includes('Connection is closed') ||
          error.message.includes('read ECONNRESET')) {
        return // Silently ignore these expected errors
      }
      console.error('❌ Redis publisher error:', error.message)
    })
  }

  // User Session Management
  async setUserSession(socketId: string, authData: SocketAuthData): Promise<void> {
    const sessionKey = `session:${socketId}`
    const userSessionsKey = `user_sessions:${authData.userId}`
    
    await Promise.all([
      this.redis.setex(sessionKey, 3600, JSON.stringify(authData)), // 1 hour expiry
      this.redis.sadd(userSessionsKey, socketId),
      this.redis.expire(userSessionsKey, 3600)
    ])
  }

  async getUserSession(socketId: string): Promise<SocketAuthData | null> {
    const sessionKey = `session:${socketId}`
    const sessionData = await this.redis.get(sessionKey)
    
    if (!sessionData) return null
    
    try {
      return JSON.parse(sessionData)
    } catch (error) {
      console.error('Error parsing session data:', error)
      return null
    }
  }

  async removeUserSession(socketId: string): Promise<void> {
    const session = await this.getUserSession(socketId)
    if (!session) return

    const sessionKey = `session:${socketId}`
    const userSessionsKey = `user_sessions:${session.userId}`
    
    await Promise.all([
      this.redis.del(sessionKey),
      this.redis.srem(userSessionsKey, socketId)
    ])
  }

  async getUserActiveSessions(userId: string): Promise<string[]> {
    const userSessionsKey = `user_sessions:${userId}`
    return await this.redis.smembers(userSessionsKey)
  }

  // Project Context Management
  async updateProjectContext(projectId: string, context: ProjectContext): Promise<void> {
    const contextKey = `project_context:${projectId}`
    const updatedContext = {
      ...context,
      updatedAt: new Date()
    }
    
    await this.redis.setex(contextKey, 86400, JSON.stringify(updatedContext)) // 24 hours
    
    // Publish update to subscribers
    await this.publisher.publish(`project_updates:${projectId}`, JSON.stringify({
      type: 'context_updated',
      projectId,
      context: updatedContext,
      timestamp: new Date()
    }))
  }

  async getProjectContext(projectId: string): Promise<ProjectContext | null> {
    const contextKey = `project_context:${projectId}`
    const contextData = await this.redis.get(contextKey)
    
    if (!contextData) return null
    
    try {
      return JSON.parse(contextData)
    } catch (error) {
      console.error('Error parsing project context:', error)
      return null
    }
  }

  // Viber Session Management
  async setViberSession(sessionId: string, session: ViberSession): Promise<void> {
    const sessionKey = `viber_session:${sessionId}`
    const projectSessionsKey = `project_viber_sessions:${session.projectId}`
    
    await Promise.all([
      this.redis.setex(sessionKey, 86400, JSON.stringify(session)), // 24 hours
      this.redis.sadd(projectSessionsKey, sessionId),
      this.redis.expire(projectSessionsKey, 86400)
    ])

    // Publish session update
    await this.publisher.publish(`viber_updates:${session.projectId}`, JSON.stringify({
      type: 'session_updated',
      sessionId,
      session,
      timestamp: new Date()
    }))
  }

  async getViberSession(sessionId: string): Promise<ViberSession | null> {
    const sessionKey = `viber_session:${sessionId}`
    const sessionData = await this.redis.get(sessionKey)
    
    if (!sessionData) return null
    
    try {
      return JSON.parse(sessionData)
    } catch (error) {
      console.error('Error parsing Viber session:', error)
      return null
    }
  }

  async getProjectViberSessions(projectId: string): Promise<ViberSession[]> {
    const projectSessionsKey = `project_viber_sessions:${projectId}`
    const sessionIds = await this.redis.smembers(projectSessionsKey)
    
    const sessions: ViberSession[] = []
    for (const sessionId of sessionIds) {
      const session = await this.getViberSession(sessionId)
      if (session) {
        sessions.push(session)
      }
    }
    
    return sessions
  }

  // User Approval Management
  async setUserApproval(sessionId: string, approved: boolean, feedback?: string): Promise<void> {
    const approvalKey = `user_approval:${sessionId}`
    const approvalData = {
      approved,
      feedback,
      timestamp: new Date()
    }
    
    await this.redis.setex(approvalKey, 3600, JSON.stringify(approvalData)) // 1 hour
    
    // Publish approval to Viber agents
    await this.publisher.publish(`approvals:${sessionId}`, JSON.stringify(approvalData))
  }

  async getUserApproval(sessionId: string): Promise<{ approved: boolean; feedback?: string; timestamp: Date } | null> {
    const approvalKey = `user_approval:${sessionId}`
    const approvalData = await this.redis.get(approvalKey)
    
    if (!approvalData) return null
    
    try {
      return JSON.parse(approvalData)
    } catch (error) {
      console.error('Error parsing approval data:', error)
      return null
    }
  }

  // Visual State Management
  async updateVisualState(projectId: string, visualState: VisualState): Promise<void> {
    const visualKey = `visual_state:${projectId}`
    const stateWithTimestamp = {
      ...visualState,
      timestamp: new Date()
    }
    
    await this.redis.setex(visualKey, 3600, JSON.stringify(stateWithTimestamp)) // 1 hour
    
    // Store in history
    const historyKey = `visual_history:${projectId}`
    await this.redis.lpush(historyKey, JSON.stringify(stateWithTimestamp))
    await this.redis.ltrim(historyKey, 0, 99) // Keep last 100 states
    await this.redis.expire(historyKey, 86400) // 24 hours

    // Publish visual update
    await this.publisher.publish(`visual_updates:${projectId}`, JSON.stringify({
      type: 'visual_state_changed',
      projectId,
      state: stateWithTimestamp,
      timestamp: new Date()
    }))
  }

  async getVisualState(projectId: string): Promise<VisualState | null> {
    const visualKey = `visual_state:${projectId}`
    const stateData = await this.redis.get(visualKey)
    
    if (!stateData) return null
    
    try {
      return JSON.parse(stateData)
    } catch (error) {
      console.error('Error parsing visual state:', error)
      return null
    }
  }

  async getVisualHistory(projectId: string, limit: number = 10): Promise<VisualState[]> {
    const historyKey = `visual_history:${projectId}`
    const historyData = await this.redis.lrange(historyKey, 0, limit - 1)
    
    const history: VisualState[] = []
    for (const data of historyData) {
      try {
        history.push(JSON.parse(data))
      } catch (error) {
        console.error('Error parsing visual history item:', error)
      }
    }
    
    return history
  }

  // Progress Management
  async updateProjectProgress(projectId: string, progress: ProjectProgress): Promise<void> {
    const progressKey = `project_progress:${projectId}`
    const progressWithTimestamp = {
      ...progress,
      lastUpdated: new Date()
    }
    
    await this.redis.setex(progressKey, 86400, JSON.stringify(progressWithTimestamp)) // 24 hours
    
    // Publish progress update
    await this.publisher.publish(`progress_updates:${projectId}`, JSON.stringify({
      type: 'progress_updated',
      projectId,
      progress: progressWithTimestamp,
      timestamp: new Date()
    }))
  }

  async getProjectProgress(projectId: string): Promise<ProjectProgress | null> {
    const progressKey = `project_progress:${projectId}`
    const progressData = await this.redis.get(progressKey)
    
    if (!progressData) return null
    
    try {
      return JSON.parse(progressData)
    } catch (error) {
      console.error('Error parsing progress data:', error)
      return null
    }
  }

  // User Settings Management
  async updateUserSettings(userId: string, settings: UserSettings): Promise<void> {
    const settingsKey = `user_settings:${userId}`
    
    await this.redis.setex(settingsKey, 2592000, JSON.stringify(settings)) // 30 days
    
    // Publish settings update
    await this.publisher.publish(`settings_updates:${userId}`, JSON.stringify({
      type: 'settings_updated',
      userId,
      settings,
      timestamp: new Date()
    }))
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const settingsKey = `user_settings:${userId}`
    const settingsData = await this.redis.get(settingsKey)
    
    if (!settingsData) return null
    
    try {
      return JSON.parse(settingsData)
    } catch (error) {
      console.error('Error parsing user settings:', error)
      return null
    }
  }

  // Error Management
  async logError(projectId: string, error: any): Promise<void> {
    const errorKey = `project_errors:${projectId}`
    const errorData = {
      error,
      timestamp: new Date(),
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    await this.redis.lpush(errorKey, JSON.stringify(errorData))
    await this.redis.ltrim(errorKey, 0, 199) // Keep last 200 errors
    await this.redis.expire(errorKey, 86400) // 24 hours

    // Publish error
    await this.publisher.publish(`errors:${projectId}`, JSON.stringify({
      type: 'error_logged',
      projectId,
      error: errorData,
      timestamp: new Date()
    }))
  }

  async getProjectErrors(projectId: string, limit: number = 50): Promise<any[]> {
    const errorKey = `project_errors:${projectId}`
    const errorData = await this.redis.lrange(errorKey, 0, limit - 1)
    
    const errors: any[] = []
    for (const data of errorData) {
      try {
        errors.push(JSON.parse(data))
      } catch (error) {
        console.error('Error parsing error data:', error)
      }
    }
    
    return errors
  }

  // Cache Management
  async setCacheData(key: string, data: any, expirySeconds: number = 3600): Promise<void> {
    await this.redis.setex(`cache:${key}`, expirySeconds, JSON.stringify(data))
  }

  async getCacheData(key: string): Promise<any | null> {
    const data = await this.redis.get(`cache:${key}`)
    if (!data) return null
    
    try {
      return JSON.parse(data)
    } catch (error) {
      console.error('Error parsing cache data:', error)
      return null
    }
  }

  async deleteCacheData(key: string): Promise<void> {
    await this.redis.del(`cache:${key}`)
  }

  // Subscription Management
  async subscribeToChannel(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel)
    this.subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(message)
      }
    })
  }

  async publishToChannel(channel: string, message: any): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(message))
  }

  // Health Check
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.redis.ping()
      return result === 'PONG'
    } catch (error) {
      console.error('Redis health check failed:', error)
      return false
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    await Promise.all([
      this.redis.disconnect(),
      this.subscriber.disconnect(),
      this.publisher.disconnect()
    ])
  }
} 