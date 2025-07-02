import { createClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type AIAssistant = 'cursor' | 'copilot' | 'windsurf' | 'codeium' | 'tabnine'
type PromptType = 'generate' | 'fix' | 'optimize' | 'test' | 'debug' | 'custom'
type SessionType = 'build' | 'debug' | 'optimize' | 'test' | 'deploy'

export interface ProjectConfig {
  id: string
  name: string
  description: string
  projectType: 'web' | 'mobile' | 'api' | 'desktop' | 'ai' | 'other'
  techStack: string[]
  repositoryUrl?: string
  localPath?: string
  aiAssistant: AIAssistant
}

export interface AIPrompt {
  type: PromptType
  text: string
  context?: {
    files?: string[]
    errors?: string[]
    requirements?: string[]
  }
}

export interface AIResponse {
  success: boolean
  response?: string
  error?: string
  filesModified?: string[]
  responseTime?: number
}

export class AIAgentController {
  private supabase = createClient()
  private currentSession: string | null = null
  private isActive = false

  constructor(private userId: string) {}

  /**
   * Start a new AI coding session
   */
  async startSession(
    projectId: string, 
    sessionType: SessionType = 'build',
    aiAssistant: AIAssistant = 'cursor'
  ): Promise<string> {
    const { data: session, error } = await this.supabase
      .from('ai_sessions')
      .insert({
        project_id: projectId,
        user_id: this.userId,
        session_type: sessionType,
        ai_assistant: aiAssistant,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to start session: ${error.message}`)
    
    this.currentSession = session.id
    this.isActive = true
    
    console.log(`🤖 AI Session started: ${session.id}`)
    return session.id
  }

  /**
   * Send a prompt to the AI assistant
   */
  async sendPrompt(
    projectId: string, 
    prompt: AIPrompt
  ): Promise<AIResponse> {
    if (!this.currentSession) {
      throw new Error('No active session. Start a session first.')
    }

    const startTime = Date.now()

    try {
      // Log the prompt to database
      const { data: promptData, error: promptError } = await this.supabase
        .from('prompts')
        .insert({
          session_id: this.currentSession,
          project_id: projectId,
          user_id: this.userId,
          prompt_type: prompt.type,
          prompt_text: prompt.text,
          context_data: prompt.context
        })
        .select()
        .single()

      if (promptError) throw new Error(`Failed to log prompt: ${promptError.message}`)

      // Send prompt to AI assistant (this would integrate with actual AI APIs)
      const aiResponse = await this.executePromptOnAI(prompt)
      
      const responseTime = Date.now() - startTime

      // Update prompt with response
      await this.supabase
        .from('prompts')
        .update({
          ai_response: aiResponse.response,
          response_time_ms: responseTime,
          success: aiResponse.success,
          error_message: aiResponse.error,
          files_modified: aiResponse.filesModified
        })
        .eq('id', promptData.id)

      // Update session statistics
      await this.updateSessionStats(promptData.session_id, aiResponse.success)

      return {
        ...aiResponse,
        responseTime
      }

    } catch (error) {
      console.error('❌ Prompt execution failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate smart prompts based on project context
   */
  async generateSmartPrompt(
    projectId: string,
    intention: string,
    files?: string[]
  ): Promise<AIPrompt> {
    // Get project context
    const projectContext = await this.getProjectContext(projectId)
    
    // Analyze recent errors
    const recentErrors = await this.getRecentErrors(projectId)
    
    // Generate contextual prompt
    let promptText = this.buildContextualPrompt(intention, projectContext, recentErrors)
    
    return {
      type: this.determinePromptType(intention),
      text: promptText,
      context: {
        files,
        errors: recentErrors.map(e => e.error_message),
        requirements: [intention]
      }
    }
  }

  /**
   * Monitor project for errors and auto-fix them
   */
  async startAutoMonitoring(projectId: string): Promise<void> {
    console.log(`👁️ Starting auto-monitoring for project: ${projectId}`)
    
    // This would integrate with file watchers and error detection
    setInterval(async () => {
      if (!this.isActive) return

      try {
        // Check for new errors
        const errors = await this.detectErrors(projectId)
        
        if (errors.length > 0) {
          console.log(`🔍 Detected ${errors.length} errors, attempting auto-fix...`)
          
          for (const error of errors) {
            await this.autoFixError(projectId, error)
          }
        }
      } catch (error) {
        console.error('❌ Auto-monitoring error:', error)
      }
    }, 10000) // Check every 10 seconds
  }

  /**
   * Auto-fix detected errors
   */
  async autoFixError(projectId: string, error: any): Promise<void> {
    const fixPrompt = await this.generateErrorFixPrompt(error)
    
    // Log error to database
    await this.logError(projectId, error)
    
    // Attempt to fix
    const response = await this.sendPrompt(projectId, fixPrompt)
    
    if (response.success) {
      console.log(`✅ Auto-fixed error: ${error.message}`)
      // Mark error as resolved
      await this.markErrorResolved(error.id)
    } else {
      console.log(`❌ Failed to auto-fix error: ${error.message}`)
    }
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) return

    await this.supabase
      .from('ai_sessions')
      .update({
        status: 'completed',
        end_time: new Date().toISOString()
      })
      .eq('id', this.currentSession)

    this.currentSession = null
    this.isActive = false
    
    console.log('🛑 AI Session ended')
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string) {
    const { data } = await this.supabase
      .from('ai_sessions')
      .select(`
        *,
        prompts(count)
      `)
      .eq('id', sessionId)
      .single()

    return data
  }

  // Private helper methods
  private async executePromptOnAI(prompt: AIPrompt): Promise<AIResponse> {
    // This would integrate with actual AI assistants
    // For now, simulate a response
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    return {
      success: Math.random() > 0.2, // 80% success rate
      response: `AI response to: ${prompt.text.substring(0, 50)}...`,
      filesModified: prompt.context?.files || []
    }
  }

  private async getProjectContext(projectId: string) {
    const { data } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    return data
  }

  private async getRecentErrors(projectId: string) {
    const { data } = await this.supabase
      .from('error_logs')
      .select('*')
      .eq('project_id', projectId)
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(5)

    return data || []
  }

  private buildContextualPrompt(
    intention: string, 
    projectContext: any, 
    errors: any[]
  ): string {
    let prompt = `Project: ${projectContext?.name}\n`
    prompt += `Tech Stack: ${projectContext?.tech_stack?.join(', ')}\n`
    prompt += `Task: ${intention}\n\n`
    
    if (errors.length > 0) {
      prompt += `Recent Errors to Consider:\n`
      errors.forEach(error => {
        prompt += `- ${error.error_message}\n`
      })
      prompt += '\n'
    }
    
    prompt += `Please help with: ${intention}`
    
    return prompt
  }

  private determinePromptType(intention: string): PromptType {
    const lowerIntention = intention.toLowerCase()
    
    if (lowerIntention.includes('fix') || lowerIntention.includes('error')) return 'fix'
    if (lowerIntention.includes('test')) return 'test'
    if (lowerIntention.includes('optimize')) return 'optimize'
    if (lowerIntention.includes('debug')) return 'debug'
    
    return 'generate'
  }

  private async detectErrors(projectId: string): Promise<any[]> {
    // This would integrate with actual error detection
    // For now, simulate error detection
    if (Math.random() > 0.8) {
      return [{
        id: 'error_' + Date.now(),
        message: 'Simulated syntax error',
        file: 'src/index.ts',
        line: 42
      }]
    }
    return []
  }

  private async generateErrorFixPrompt(error: any): Promise<AIPrompt> {
    return {
      type: 'fix',
      text: `Please fix this error: ${error.message} in file ${error.file} at line ${error.line}`,
      context: {
        errors: [error.message],
        files: [error.file]
      }
    }
  }

  private async logError(projectId: string, error: any): Promise<void> {
    await this.supabase
      .from('error_logs')
      .insert({
        project_id: projectId,
        session_id: this.currentSession,
        error_type: 'syntax',
        error_message: error.message,
        file_path: error.file,
        line_number: error.line
      })
  }

  private async markErrorResolved(errorId: string): Promise<void> {
    await this.supabase
      .from('error_logs')
      .update({ resolved: true })
      .eq('id', errorId)
  }

  private async updateSessionStats(sessionId: string, success: boolean): Promise<void> {
    const { data } = await this.supabase
      .from('ai_sessions')
      .select('total_prompts, successful_prompts')
      .eq('id', sessionId)
      .single()

    if (data) {
      await this.supabase
        .from('ai_sessions')
        .update({
          total_prompts: data.total_prompts + 1,
          successful_prompts: success ? data.successful_prompts + 1 : data.successful_prompts
        })
        .eq('id', sessionId)
    }
  }
} 