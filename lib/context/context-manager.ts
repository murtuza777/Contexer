import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ProjectContext {
  id: string
  user_id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'completed' | 'paused' | 'building' | 'error'
  project_type: 'web' | 'mobile' | 'api' | 'desktop' | 'ai' | 'other'
  context_data: Record<string, any>
  user_stories: string[]
  tech_stack: string[]
  target_audience: string
  features: string[]
  requirements: string
  design_preferences: string
  deployment_platform: string
  timeline: string
  template_id?: string
  uploaded_files: any[]
  created_at: string
  updated_at: string
}

export interface ContextRevision {
  id: string
  project_id: string
  revision_number: number
  context_data: Record<string, any>
  user_stories: string[]
  tech_stack: string[]
  changes_summary: string
  created_by: string
  created_at: string
}

export class ContextManager {
  private static instance: ContextManager
  private realtimeChannel: any = null

  private constructor() {}

  static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager()
    }
    return ContextManager.instance
  }

  // Real-time subscription management
  subscribeToContextChanges(userId: string, callback: (payload: any) => void) {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe()
    }

    this.realtimeChannel = supabase
      .channel(`context_changes_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()

    return this.realtimeChannel
  }

  unsubscribeFromContextChanges() {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe()
      this.realtimeChannel = null
    }
  }

  // Context CRUD operations
  async createContext(userId: string, contextData: Partial<ProjectContext>): Promise<ProjectContext | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: contextData.name || 'Untitled Project',
          description: contextData.description || '',
          status: 'draft',
          project_type: contextData.project_type || 'web',
          context_data: contextData.context_data || {},
          user_stories: contextData.user_stories || [],
          tech_stack: contextData.tech_stack || [],
          target_audience: contextData.target_audience || '',
          features: contextData.features || [],
          requirements: contextData.requirements || '',
          design_preferences: contextData.design_preferences || '',
          deployment_platform: contextData.deployment_platform || '',
          timeline: contextData.timeline || '',
          template_id: contextData.template_id || null,
          uploaded_files: contextData.uploaded_files || []
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating context:', error)
        return null
      }

      // Create initial revision
      await this.createRevision(data.id, {
        context_data: data.context_data,
        user_stories: data.user_stories,
        tech_stack: data.tech_stack,
        changes_summary: 'Initial context creation',
        created_by: userId
      })

      return data
    } catch (error) {
      console.error('Context creation error:', error)
      return null
    }
  }

  async getContext(contextId: string, userId: string): Promise<ProjectContext | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', contextId)
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching context:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Context fetch error:', error)
      return null
    }
  }

  async getUserContexts(userId: string): Promise<ProjectContext[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching user contexts:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('User contexts fetch error:', error)
      return []
    }
  }

  async updateContext(
    contextId: string, 
    userId: string, 
    updates: Partial<ProjectContext>,
    changesSummary?: string
  ): Promise<ProjectContext | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', contextId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating context:', error)
        return null
      }

      // Create revision if significant changes
      if (updates.context_data || updates.user_stories || updates.tech_stack) {
        await this.createRevision(contextId, {
          context_data: data.context_data,
          user_stories: data.user_stories,
          tech_stack: data.tech_stack,
          changes_summary: changesSummary || 'Context updated',
          created_by: userId
        })
      }

      return data
    } catch (error) {
      console.error('Context update error:', error)
      return null
    }
  }

  async deleteContext(contextId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', contextId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting context:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Context deletion error:', error)
      return false
    }
  }

  // Revision management
  async createRevision(
    projectId: string, 
    revisionData: {
      context_data: Record<string, any>
      user_stories: string[]
      tech_stack: string[]
      changes_summary: string
      created_by: string
    }
  ): Promise<ContextRevision | null> {
    try {
      // Get the next revision number
      const { data: lastRevision } = await supabase
        .from('project_revisions')
        .select('revision_number')
        .eq('project_id', projectId)
        .order('revision_number', { ascending: false })
        .limit(1)
        .single()

      const nextRevisionNumber = (lastRevision?.revision_number || 0) + 1

      const { data, error } = await supabase
        .from('project_revisions')
        .insert({
          project_id: projectId,
          revision_number: nextRevisionNumber,
          ...revisionData
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating revision:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Revision creation error:', error)
      return null
    }
  }

  async getContextRevisions(projectId: string): Promise<ContextRevision[]> {
    try {
      const { data, error } = await supabase
        .from('project_revisions')
        .select('*')
        .eq('project_id', projectId)
        .order('revision_number', { ascending: false })

      if (error) {
        console.error('Error fetching revisions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Revisions fetch error:', error)
      return []
    }
  }

  async revertToRevision(
    projectId: string, 
    userId: string, 
    revisionNumber: number
  ): Promise<ProjectContext | null> {
    try {
      // Get the revision data
      const { data: revision, error: revisionError } = await supabase
        .from('project_revisions')
        .select('*')
        .eq('project_id', projectId)
        .eq('revision_number', revisionNumber)
        .single()

      if (revisionError || !revision) {
        console.error('Error fetching revision:', revisionError)
        return null
      }

      // Update the project with revision data
      const updates = {
        context_data: revision.context_data,
        user_stories: revision.user_stories,
        tech_stack: revision.tech_stack
      }

      return await this.updateContext(
        projectId, 
        userId, 
        updates, 
        `Reverted to revision ${revisionNumber}`
      )
    } catch (error) {
      console.error('Revision revert error:', error)
      return null
    }
  }

  // Context validation
  validateContext(context: Partial<ProjectContext>): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!context.name?.trim()) {
      errors.push('Project name is required')
    }

    if (!context.description?.trim()) {
      errors.push('Project description is required')
    }

    if (!context.tech_stack?.length) {
      errors.push('At least one technology must be selected')
    }

    // Recommendations
    if (!context.user_stories?.length || !context.user_stories.some(story => story.trim())) {
      warnings.push('Adding user stories will help define project requirements')
    }

    if (!context.features?.length || !context.features.some(feature => feature.trim())) {
      warnings.push('Defining key features will guide development')
    }

    if (!context.target_audience?.trim()) {
      warnings.push('Defining target audience helps with design decisions')
    }

    if (!context.deployment_platform?.trim()) {
      warnings.push('Selecting deployment platform helps with tech stack decisions')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Context analysis and insights
  getContextInsights(context: ProjectContext): {
    completionPercentage: number
    missingFields: string[]
    techStackAnalysis: { complexity: string; recommendation: string }
    estimatedTimeline: string
  } {
    const requiredFields = [
      'name', 'description', 'tech_stack', 'user_stories', 
      'features', 'target_audience', 'requirements'
    ]

    const missingFields: string[] = []
    let completedFields = 0

    requiredFields.forEach(field => {
      const value = context[field as keyof ProjectContext]
      let hasValue = false

      if (field === 'tech_stack' || field === 'user_stories' || field === 'features') {
        hasValue = Array.isArray(value) && value.length > 0 && 
                   value.some(item => typeof item === 'string' ? item.trim() : true)
      } else {
        hasValue = typeof value === 'string' && value.trim().length > 0
      }

      if (hasValue) {
        completedFields++
      } else {
        missingFields.push(field.replace('_', ' '))
      }
    })

    const completionPercentage = Math.round((completedFields / requiredFields.length) * 100)

    // Tech stack analysis
    const techStackSize = context.tech_stack?.length || 0
    let complexity = 'Low'
    let recommendation = 'Good balance of technologies'

    if (techStackSize > 8) {
      complexity = 'High'
      recommendation = 'Consider simplifying the tech stack to reduce complexity'
    } else if (techStackSize > 5) {
      complexity = 'Medium'
      recommendation = 'Well-rounded tech stack with good coverage'
    }

    // Timeline estimation based on features and complexity
    const featureCount = context.features?.filter(f => f.trim()).length || 0
    let estimatedTimeline = '2-3 weeks'

    if (featureCount > 15 || complexity === 'High') {
      estimatedTimeline = '8-12 weeks'
    } else if (featureCount > 10 || complexity === 'Medium') {
      estimatedTimeline = '6-8 weeks'
    } else if (featureCount > 5) {
      estimatedTimeline = '4-6 weeks'
    }

    return {
      completionPercentage,
      missingFields,
      techStackAnalysis: { complexity, recommendation },
      estimatedTimeline
    }
  }

  // Search and filtering
  async searchContexts(
    userId: string, 
    query: string, 
    filters?: {
      status?: string[]
      techStack?: string[]
      dateRange?: { start: string; end: string }
    }
  ): Promise<ProjectContext[]> {
    try {
      let supabaseQuery = supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)

      // Text search
      if (query.trim()) {
        supabaseQuery = supabaseQuery.or(
          `name.ilike.%${query}%,description.ilike.%${query}%`
        )
      }

      // Status filter
      if (filters?.status?.length) {
        supabaseQuery = supabaseQuery.in('status', filters.status)
      }

      // Date range filter
      if (filters?.dateRange) {
        supabaseQuery = supabaseQuery
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end)
      }

      const { data, error } = await supabaseQuery
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error searching contexts:', error)
        return []
      }

      let results = data || []

      // Tech stack filter (client-side due to JSON array complexity)
      if (filters?.techStack?.length) {
        results = results.filter(context => 
          filters.techStack!.some(tech => 
            context.tech_stack?.includes(tech)
          )
        )
      }

      return results
    } catch (error) {
      console.error('Context search error:', error)
      return []
    }
  }

  // Bulk operations
  async bulkUpdateContexts(
    userId: string, 
    contextIds: string[], 
    updates: Partial<ProjectContext>
  ): Promise<ProjectContext[]> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('user_id', userId)
        .in('id', contextIds)
        .select()

      if (error) {
        console.error('Error bulk updating contexts:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Bulk update error:', error)
      return []
    }
  }

  async duplicateContext(
    contextId: string, 
    userId: string, 
    newName?: string
  ): Promise<ProjectContext | null> {
    try {
      const originalContext = await this.getContext(contextId, userId)
      if (!originalContext) {
        return null
      }

      const { id, created_at, updated_at, ...contextData } = originalContext

      const duplicatedContext = {
        ...contextData,
        name: newName || `${originalContext.name} (Copy)`,
        status: 'draft' as const
      }

      return await this.createContext(userId, duplicatedContext)
    } catch (error) {
      console.error('Context duplication error:', error)
      return null
    }
  }
} 