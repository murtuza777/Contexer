import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ProjectContext {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'completed' | 'paused' | 'building' | 'error'
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
  uploaded_files: Array<{
    id: string
    name: string
    type: string
    size: number
    uploadedAt: string
    processed: boolean
  }>
  created_at: string
  updated_at: string
}

export interface ContextTemplate {
  id: string
  name: string
  category: string
  description: string
  tech_stack: Record<string, any>
  template_data: Record<string, any>
  user_stories: string[]
  features: string[]
  requirements: string
  design_preferences: string
  deployment_platform: string
  is_public: boolean
  created_at: string
}

export interface UseContextComposerResult {
  // State
  contexts: ProjectContext[]
  templates: ContextTemplate[]
  currentContext: ProjectContext | null
  loading: boolean
  saving: boolean
  error: string | null
  
  // Context operations
  createContext: (data: Partial<ProjectContext>) => Promise<ProjectContext | null>
  updateContext: (contextId: string, data: Partial<ProjectContext>) => Promise<ProjectContext | null>
  deleteContext: (contextId: string) => Promise<boolean>
  loadContext: (contextId: string) => Promise<ProjectContext | null>
  setCurrentContext: (context: ProjectContext | null) => void
  
  // Template operations
  loadTemplates: (category?: string) => Promise<void>
  createTemplate: (data: Partial<ContextTemplate>) => Promise<ContextTemplate | null>
  applyTemplate: (templateId: string, contextId?: string) => Promise<ProjectContext | null>
  
  // File operations
  uploadFile: (file: File, contextId: string) => Promise<any>
  deleteFile: (fileId: string, contextId: string) => Promise<boolean>
  
  // Utility functions
  validateContext: (context: Partial<ProjectContext>) => { isValid: boolean; errors: string[] }
  getCompletionStatus: (context: ProjectContext) => { percentage: number; missingFields: string[] }
  exportContext: (context: ProjectContext) => void
  importContext: (jsonData: string) => Promise<ProjectContext | null>
}

export function useContextComposer(userId: string): UseContextComposerResult {
  const [contexts, setContexts] = useState<ProjectContext[]>([])
  const [templates, setTemplates] = useState<ContextTemplate[]>([])
  const [currentContext, setCurrentContext] = useState<ProjectContext | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load contexts on mount
  useEffect(() => {
    if (!userId) return
    
    // Load contexts immediately
    const loadInitialContexts = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/context?userId=${userId}`)
        const result = await response.json()

        if (result.success) {
          setContexts(result.data)
        } else {
          setError(result.error || 'Failed to load contexts')
        }
      } catch (err) {
        setError('Network error while loading contexts')
        console.error('Error loading contexts:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialContexts()
    
    // Setup real-time subscription
    // Note: In a real app, this would setup Supabase realtime subscription
    console.log('Setting up realtime subscription for user:', userId)
  }, [userId])

  // Load user contexts
  const loadContexts = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/context?userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        setContexts(result.data)
      } else {
        setError(result.error || 'Failed to load contexts')
      }
    } catch (err) {
      setError('Network error while loading contexts')
      console.error('Error loading contexts:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Setup real-time subscription for context changes
  const setupRealtimeSubscription = useCallback(() => {
    if (!userId) return

    const subscription = supabase
      .channel('context_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time context update:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              setContexts(prev => [payload.new as ProjectContext, ...prev])
              break
            case 'UPDATE':
              setContexts(prev => 
                prev.map(ctx => 
                  ctx.id === payload.new.id ? { ...ctx, ...payload.new } : ctx
                )
              )
              // Update current context if it's the one being updated
              if (currentContext?.id === payload.new.id) {
                setCurrentContext(prev => prev ? { ...prev, ...payload.new } : null)
              }
              break
            case 'DELETE':
              setContexts(prev => prev.filter(ctx => ctx.id !== payload.old.id))
              if (currentContext?.id === payload.old.id) {
                setCurrentContext(null)
              }
              break
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, currentContext])

  // Create new context
  const createContext = useCallback(async (data: Partial<ProjectContext>): Promise<ProjectContext | null> => {
    if (!userId) {
      setError('User ID is required')
      return null
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...data
        })
      })

      const result = await response.json()

      if (result.success) {
        const newContext = result.data
        setContexts(prev => [newContext, ...prev])
        setCurrentContext(newContext)
        return newContext
      } else {
        setError(result.error || 'Failed to create context')
        return null
      }
    } catch (err) {
      setError('Network error while creating context')
      console.error('Error creating context:', err)
      return null
    } finally {
      setSaving(false)
    }
  }, [userId])

  // Update existing context
  const updateContext = useCallback(async (contextId: string, data: Partial<ProjectContext>): Promise<ProjectContext | null> => {
    if (!userId) {
      setError('User ID is required')
      return null
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/context', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: contextId,
          userId,
          changes_summary: `Updated context fields: ${Object.keys(data).join(', ')}`,
          ...data
        })
      })

      const result = await response.json()

      if (result.success) {
        const updatedContext = result.data
        setContexts(prev => 
          prev.map(ctx => ctx.id === contextId ? updatedContext : ctx)
        )
        if (currentContext?.id === contextId) {
          setCurrentContext(updatedContext)
        }
        return updatedContext
      } else {
        setError(result.error || 'Failed to update context')
        return null
      }
    } catch (err) {
      setError('Network error while updating context')
      console.error('Error updating context:', err)
      return null
    } finally {
      setSaving(false)
    }
  }, [userId, currentContext])

  // Delete context
  const deleteContext = useCallback(async (contextId: string): Promise<boolean> => {
    if (!userId) {
      setError('User ID is required')
      return false
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/context?projectId=${contextId}&userId=${userId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setContexts(prev => prev.filter(ctx => ctx.id !== contextId))
        if (currentContext?.id === contextId) {
          setCurrentContext(null)
        }
        return true
      } else {
        setError(result.error || 'Failed to delete context')
        return false
      }
    } catch (err) {
      setError('Network error while deleting context')
      console.error('Error deleting context:', err)
      return false
    } finally {
      setSaving(false)
    }
  }, [userId, currentContext])

  // Load specific context
  const loadContext = useCallback(async (contextId: string): Promise<ProjectContext | null> => {
    const existingContext = contexts.find(ctx => ctx.id === contextId)
    if (existingContext) {
      setCurrentContext(existingContext)
      return existingContext
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/context?userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        const context = result.data.find((ctx: ProjectContext) => ctx.id === contextId)
        if (context) {
          setCurrentContext(context)
          return context
        } else {
          setError('Context not found')
          return null
        }
      } else {
        setError(result.error || 'Failed to load context')
        return null
      }
    } catch (err) {
      setError('Network error while loading context')
      console.error('Error loading context:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [contexts, userId])

  // Load templates
  const loadTemplates = useCallback(async (category?: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (userId) params.append('userId', userId)

      const response = await fetch(`/api/context/templates?${params}`)
      const result = await response.json()

      if (result.success) {
        setTemplates(result.data)
      } else {
        setError(result.error || 'Failed to load templates')
      }
    } catch (err) {
      setError('Network error while loading templates')
      console.error('Error loading templates:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Create template
  const createTemplate = useCallback(async (data: Partial<ContextTemplate>): Promise<ContextTemplate | null> => {
    if (!userId) {
      setError('User ID is required')
      return null
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/context/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...data
        })
      })

      const result = await response.json()

      if (result.success) {
        const newTemplate = result.data
        setTemplates(prev => [newTemplate, ...prev])
        return newTemplate
      } else {
        setError(result.error || 'Failed to create template')
        return null
      }
    } catch (err) {
      setError('Network error while creating template')
      console.error('Error creating template:', err)
      return null
    } finally {
      setSaving(false)
    }
  }, [userId])

  // Apply template to create new context or update existing
  const applyTemplate = useCallback(async (templateId: string, contextId?: string): Promise<ProjectContext | null> => {
    const template = templates.find(t => t.id === templateId)
    if (!template) {
      setError('Template not found')
      return null
    }

    const templateData = {
      name: contextId ? undefined : template.name,
      description: template.description,
      tech_stack: Object.keys(template.tech_stack),
      user_stories: template.user_stories,
      features: template.features,
      requirements: template.requirements,
      design_preferences: template.design_preferences,
      deployment_platform: template.deployment_platform,
      template_id: templateId,
      context_data: template.template_data
    }

    if (contextId) {
      return await updateContext(contextId, templateData)
    } else {
      return await createContext(templateData)
    }
  }, [templates, updateContext, createContext])

  // Upload file
  const uploadFile = useCallback(async (file: File, contextId: string) => {
    if (!userId) {
      setError('User ID is required')
      return null
    }

    setSaving(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', contextId)
      formData.append('userId', userId)

      const response = await fetch('/api/context/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // Update the context with new file info
        await loadContexts() // Refresh contexts to get updated file list
        return result.data
      } else {
        setError(result.error || 'Failed to upload file')
        return null
      }
    } catch (err) {
      setError('Network error while uploading file')
      console.error('Error uploading file:', err)
      return null
    } finally {
      setSaving(false)
    }
  }, [userId, loadContexts])

  // Delete file
  const deleteFile = useCallback(async (fileId: string, contextId: string): Promise<boolean> => {
    if (!userId) {
      setError('User ID is required')
      return false
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/context/upload?fileId=${fileId}&projectId=${contextId}&userId=${userId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        await loadContexts() // Refresh contexts to get updated file list
        return true
      } else {
        setError(result.error || 'Failed to delete file')
        return false
      }
    } catch (err) {
      setError('Network error while deleting file')
      console.error('Error deleting file:', err)
      return false
    } finally {
      setSaving(false)
    }
  }, [userId, loadContexts])

  // Validate context
  const validateContext = useCallback((context: Partial<ProjectContext>) => {
    const errors: string[] = []
    
    if (!context.name?.trim()) {
      errors.push('Project name is required')
    }
    
    if (!context.description?.trim()) {
      errors.push('Project description is required')
    }
    
    if (!context.tech_stack?.length) {
      errors.push('At least one technology must be selected')
    }
    
    if (!context.user_stories?.some(story => story.trim())) {
      errors.push('At least one user story is required')
    }
    
    if (!context.features?.some(feature => feature.trim())) {
      errors.push('At least one feature is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }, [])

  // Get completion status
  const getCompletionStatus = useCallback((context: ProjectContext) => {
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
        hasValue = Array.isArray(value) && value.length > 0 && value.some(item => typeof item === 'string' ? item.trim() : true)
      } else {
        hasValue = typeof value === 'string' && value.trim().length > 0
      }
      
      if (hasValue) {
        completedFields++
      } else {
        missingFields.push(field.replace('_', ' '))
      }
    })
    
    return {
      percentage: Math.round((completedFields / requiredFields.length) * 100),
      missingFields
    }
  }, [])

  // Export context
  const exportContext = useCallback((context: ProjectContext) => {
    const dataStr = JSON.stringify(context, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${context.name || 'project-context'}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }, [])

  // Import context
  const importContext = useCallback(async (jsonData: string): Promise<ProjectContext | null> => {
    try {
      const contextData = JSON.parse(jsonData)
      
      // Remove ID and dates to create a new context
      const { id, created_at, updated_at, ...importData } = contextData
      
      // Add import suffix to name to avoid conflicts
      if (importData.name) {
        importData.name = `${importData.name} (Imported)`
      }
      
      return await createContext(importData)
    } catch (err) {
      setError('Invalid JSON format')
      console.error('Error importing context:', err)
      return null
    }
  }, [createContext])

  return {
    // State
    contexts,
    templates,
    currentContext,
    loading,
    saving,
    error,
    
    // Context operations
    createContext,
    updateContext,
    deleteContext,
    loadContext,
    setCurrentContext,
    
    // Template operations
    loadTemplates,
    createTemplate,
    applyTemplate,
    
    // File operations
    uploadFile,
    deleteFile,
    
    // Utility functions
    validateContext,
    getCompletionStatus,
    exportContext,
    importContext
  }
} 