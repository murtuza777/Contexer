import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { ProjectContext, ProjectProgress, UserSettings } from './redis-state-manager'

export interface DatabaseProject {
  id: string
  user_id: string
  title: string
  description: string
  tech_stack: string[]
  requirements: string[]
  user_stories: string[]
  readme?: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export interface DatabaseViberSession {
  id: string
  user_id: string
  project_id: string
  status: 'active' | 'paused' | 'completed' | 'error'
  current_task: string
  progress: number
  session_data: any
  created_at: string
  updated_at: string
}

export interface DatabaseError {
  id: string
  project_id: string
  viber_session_id?: string
  error_type: string
  error_message: string
  stack_trace?: string
  resolved: boolean
  resolution?: string
  created_at: string
  resolved_at?: string
}

export class SupabaseRealtimeManager {
  private supabase: SupabaseClient
  private channels: Map<string, RealtimeChannel> = new Map()
  private eventCallbacks: Map<string, Function[]> = new Map()

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

    this.setupDatabaseTriggers()
  }

  private setupDatabaseTriggers() {
    // Listen to projects table changes
    this.subscribeToTable('projects', (payload) => {
      this.handleProjectChange(payload)
    })

    // Listen to viber_sessions table changes
    this.subscribeToTable('viber_sessions', (payload) => {
      this.handleViberSessionChange(payload)
    })

    // Listen to project_errors table changes
    this.subscribeToTable('project_errors', (payload) => {
      this.handleErrorChange(payload)
    })

    // Listen to user_settings table changes
    this.subscribeToTable('user_settings', (payload) => {
      this.handleUserSettingsChange(payload)
    })

    // Listen to project_progress table changes
    this.subscribeToTable('project_progress', (payload) => {
      this.handleProgressChange(payload)
    })
  }

  private subscribeToTable(tableName: string, callback: (payload: RealtimePostgresChangesPayload<any>) => void) {
    const channel = this.supabase
      .channel(`public:${tableName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        callback
      )
      .subscribe()

    this.channels.set(tableName, channel)
  }

  // User Authentication and Verification
  async verifyUser(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.auth.admin.getUserById(userId)
      return !error && !!data.user
    } catch (error) {
      console.error('Error verifying user:', error)
      return false
    }
  }

  async getUserProfile(userId: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // Project Management
  async saveProjectContext(projectId: string, context: ProjectContext): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('projects')
        .upsert({
          id: projectId,
          title: context.title,
          description: context.description,
          tech_stack: context.techStack,
          requirements: context.requirements,
          user_stories: context.userStories,
          readme: context.readme,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving project context:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error saving project context:', error)
      return false
    }
  }

  async getProjectContext(projectId: string): Promise<ProjectContext | null> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error || !data) {
        console.error('Error fetching project context:', error)
        return null
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        techStack: data.tech_stack,
        requirements: data.requirements,
        userStories: data.user_stories,
        readme: data.readme,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Error fetching project context:', error)
      return null
    }
  }

  async getUserProjects(userId: string): Promise<DatabaseProject[]> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching user projects:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching user projects:', error)
      return []
    }
  }

  // Viber Session Management
  async saveViberSession(sessionData: DatabaseViberSession): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('viber_sessions')
        .upsert({
          id: sessionData.id,
          user_id: sessionData.user_id,
          project_id: sessionData.project_id,
          status: sessionData.status,
          current_task: sessionData.current_task,
          progress: sessionData.progress,
          session_data: sessionData.session_data,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving Viber session:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error saving Viber session:', error)
      return false
    }
  }

  async getViberSession(sessionId: string): Promise<DatabaseViberSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('viber_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error || !data) {
        console.error('Error fetching Viber session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching Viber session:', error)
      return null
    }
  }

  async getProjectViberSessions(projectId: string): Promise<DatabaseViberSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('viber_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching project Viber sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching project Viber sessions:', error)
      return []
    }
  }

  // Error Management
  async logError(projectId: string, viberSessionId: string | undefined, error: any): Promise<string | null> {
    try {
      const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const { error: insertError } = await this.supabase
        .from('project_errors')
        .insert({
          id: errorId,
          project_id: projectId,
          viber_session_id: viberSessionId,
          error_type: error.type || 'unknown',
          error_message: error.message || error.toString(),
          stack_trace: error.stack,
          resolved: false,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error logging error to database:', insertError)
        return null
      }

      return errorId
    } catch (error) {
      console.error('Error logging error to database:', error)
      return null
    }
  }

  async resolveError(errorId: string, resolution: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('project_errors')
        .update({
          resolved: true,
          resolution: resolution,
          resolved_at: new Date().toISOString()
        })
        .eq('id', errorId)

      if (error) {
        console.error('Error resolving error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error resolving error:', error)
      return false
    }
  }

  async getProjectErrors(projectId: string, onlyUnresolved: boolean = false): Promise<DatabaseError[]> {
    try {
      let query = this.supabase
        .from('project_errors')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (onlyUnresolved) {
        query = query.eq('resolved', false)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching project errors:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching project errors:', error)
      return []
    }
  }

  // Progress Management
  async saveProjectProgress(progress: ProjectProgress): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('project_progress')
        .upsert({
          project_id: progress.projectId,
          total_features: progress.totalFeatures,
          completed_features: progress.completedFeatures,
          current_feature: progress.currentFeature,
          percentage: progress.percentage,
          milestones: progress.milestones,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving project progress:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error saving project progress:', error)
      return false
    }
  }

  async getProjectProgress(projectId: string): Promise<ProjectProgress | null> {
    try {
      const { data, error } = await this.supabase
        .from('project_progress')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (error || !data) {
        console.error('Error fetching project progress:', error)
        return null
      }

      return {
        projectId: data.project_id,
        totalFeatures: data.total_features,
        completedFeatures: data.completed_features,
        currentFeature: data.current_feature,
        percentage: data.percentage,
        milestones: data.milestones,
        lastUpdated: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Error fetching project progress:', error)
      return null
    }
  }

  // User Settings Management
  async saveUserSettings(settings: UserSettings): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_settings')
        .upsert({
          user_id: settings.userId,
          ai_model: settings.aiModel,
          code_editor: settings.codeEditor,
          theme: settings.theme,
          notifications: settings.notifications,
          auto_approval: settings.autoApproval,
          extensions: settings.extensions,
          custom_prompts: settings.customPrompts,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving user settings:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error saving user settings:', error)
      return false
    }
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        console.error('Error fetching user settings:', error)
        return null
      }

      return {
        userId: data.user_id,
        aiModel: data.ai_model,
        codeEditor: data.code_editor,
        theme: data.theme,
        notifications: data.notifications,
        autoApproval: data.auto_approval,
        extensions: data.extensions,
        customPrompts: data.custom_prompts
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
      return null
    }
  }

  // Event Handlers for Database Changes
  private handleProjectChange(payload: RealtimePostgresChangesPayload<any>) {
    console.log('Project changed:', payload)
    this.emitEvent('project_changed', payload)
  }

  private handleViberSessionChange(payload: RealtimePostgresChangesPayload<any>) {
    console.log('Viber session changed:', payload)
    this.emitEvent('viber_session_changed', payload)
  }

  private handleErrorChange(payload: RealtimePostgresChangesPayload<any>) {
    console.log('Error changed:', payload)
    this.emitEvent('error_changed', payload)
  }

  private handleUserSettingsChange(payload: RealtimePostgresChangesPayload<any>) {
    console.log('User settings changed:', payload)
    this.emitEvent('user_settings_changed', payload)
  }

  private handleProgressChange(payload: RealtimePostgresChangesPayload<any>) {
    console.log('Progress changed:', payload)
    this.emitEvent('progress_changed', payload)
  }

  // Event System
  public onEvent(eventName: string, callback: Function) {
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, [])
    }
    this.eventCallbacks.get(eventName)!.push(callback)
  }

  private emitEvent(eventName: string, data: any) {
    const callbacks = this.eventCallbacks.get(eventName)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event callback for ${eventName}:`, error)
        }
      })
    }
  }

  // Health Check
  async isHealthy(): Promise<boolean> {
    try {
      const { error } = await this.supabase.from('projects').select('id').limit(1)
      return !error
    } catch (error) {
      console.error('Supabase health check failed:', error)
      return false
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    // Unsubscribe from all channels
    for (const [tableName, channel] of this.channels) {
      await this.supabase.removeChannel(channel)
    }
    this.channels.clear()
    this.eventCallbacks.clear()
  }
} 