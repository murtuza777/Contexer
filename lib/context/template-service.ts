import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  created_by?: string
  created_at: string
  updated_at: string
}

export interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  count: number
}

export interface TemplateSuggestion {
  template: ContextTemplate
  matchScore: number
  reasons: string[]
}

export class TemplateService {
  private static instance: TemplateService

  private constructor() {}

  static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService()
    }
    return TemplateService.instance
  }

  // Template CRUD operations
  async createTemplate(
    userId: string, 
    templateData: Partial<ContextTemplate>
  ): Promise<ContextTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('context_templates')
        .insert({
          name: templateData.name || 'Untitled Template',
          category: templateData.category || 'custom',
          description: templateData.description || '',
          tech_stack: templateData.tech_stack || {},
          template_data: templateData.template_data || {},
          user_stories: templateData.user_stories || [],
          features: templateData.features || [],
          requirements: templateData.requirements || '',
          design_preferences: templateData.design_preferences || '',
          deployment_platform: templateData.deployment_platform || '',
          is_public: templateData.is_public || false,
          created_by: userId
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating template:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Template creation error:', error)
      return null
    }
  }

  async getTemplate(templateId: string): Promise<ContextTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('context_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) {
        console.error('Error fetching template:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Template fetch error:', error)
      return null
    }
  }

  async getTemplates(
    filters?: {
      category?: string
      userId?: string
      publicOnly?: boolean
      searchQuery?: string
    }
  ): Promise<ContextTemplate[]> {
    try {
      let query = supabase
        .from('context_templates')
        .select('*')

      // Filter by category
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      // Filter by public/private
      if (filters?.publicOnly) {
        query = query.eq('is_public', true)
      } else if (filters?.userId) {
        query = query.or(`is_public.eq.true,created_by.eq.${filters.userId}`)
      } else {
        query = query.eq('is_public', true)
      }

      // Search query
      if (filters?.searchQuery?.trim()) {
        query = query.or(
          `name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
        )
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching templates:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Templates fetch error:', error)
      return []
    }
  }

  async updateTemplate(
    templateId: string, 
    userId: string, 
    updates: Partial<ContextTemplate>
  ): Promise<ContextTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('context_templates')
        .update(updates)
        .eq('id', templateId)
        .eq('created_by', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating template:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Template update error:', error)
      return null
    }
  }

  async deleteTemplate(templateId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('context_templates')
        .delete()
        .eq('id', templateId)
        .eq('created_by', userId)

      if (error) {
        console.error('Error deleting template:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Template deletion error:', error)
      return false
    }
  }

  // Template categories
  async getTemplateCategories(): Promise<TemplateCategory[]> {
    try {
      const { data, error } = await supabase
        .from('context_templates')
        .select('category')
        .eq('is_public', true)

      if (error) {
        console.error('Error fetching categories:', error)
        return this.getDefaultCategories()
      }

      // Count templates per category
      const categoryCounts: { [key: string]: number } = {}
      data?.forEach(template => {
        categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1
      })

      const defaultCategories = this.getDefaultCategories()
      return defaultCategories.map(category => ({
        ...category,
        count: categoryCounts[category.id] || 0
      }))
    } catch (error) {
      console.error('Categories fetch error:', error)
      return this.getDefaultCategories()
    }
  }

  private getDefaultCategories(): TemplateCategory[] {
    return [
      {
        id: 'web',
        name: 'Web Applications',
        description: 'Full-stack web applications and SPAs',
        icon: '🌐',
        count: 0
      },
      {
        id: 'mobile',
        name: 'Mobile Apps',
        description: 'Native and cross-platform mobile applications',
        icon: '📱',
        count: 0
      },
      {
        id: 'api',
        name: 'APIs & Backend',
        description: 'REST APIs, GraphQL, and backend services',
        icon: '🔌',
        count: 0
      },
      {
        id: 'desktop',
        name: 'Desktop Applications',
        description: 'Cross-platform desktop applications',
        icon: '🖥️',
        count: 0
      },
      {
        id: 'ai',
        name: 'AI & ML',
        description: 'Machine learning and AI-powered applications',
        icon: '🤖',
        count: 0
      },
      {
        id: 'game',
        name: 'Games',
        description: 'Web games, mobile games, and interactive experiences',
        icon: '🎮',
        count: 0
      },
      {
        id: 'ecommerce',
        name: 'E-commerce',
        description: 'Online stores and marketplace applications',
        icon: '🛒',
        count: 0
      },
      {
        id: 'productivity',
        name: 'Productivity',
        description: 'Task management, collaboration, and productivity tools',
        icon: '📊',
        count: 0
      },
      {
        id: 'social',
        name: 'Social & Community',
        description: 'Social networks, forums, and community platforms',
        icon: '👥',
        count: 0
      },
      {
        id: 'custom',
        name: 'Custom',
        description: 'User-created custom templates',
        icon: '⚡',
        count: 0
      }
    ]
  }

  // Template suggestions based on user input
  async getTemplateSuggestions(
    userInput: {
      description?: string
      techStack?: string[]
      features?: string[]
      projectType?: string
    },
    limit: number = 5
  ): Promise<TemplateSuggestion[]> {
    try {
      const templates = await this.getTemplates({ publicOnly: true })
      const suggestions: TemplateSuggestion[] = []

      for (const template of templates) {
        const matchScore = this.calculateMatchScore(template, userInput)
        const reasons = this.generateMatchReasons(template, userInput)

        if (matchScore > 0) {
          suggestions.push({
            template,
            matchScore,
            reasons
          })
        }
      }

      // Sort by match score and return top results
      return suggestions
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit)
    } catch (error) {
      console.error('Template suggestions error:', error)
      return []
    }
  }

  private calculateMatchScore(
    template: ContextTemplate, 
    userInput: {
      description?: string
      techStack?: string[]
      features?: string[]
      projectType?: string
    }
  ): number {
    let score = 0

    // Category/project type match
    if (userInput.projectType && template.category === userInput.projectType) {
      score += 30
    }

    // Tech stack overlap
    if (userInput.techStack?.length && template.tech_stack) {
      const templateTechStack = Object.keys(template.tech_stack)
      const commonTech = userInput.techStack.filter(tech => 
        templateTechStack.some(templateTech => 
          templateTech.toLowerCase().includes(tech.toLowerCase()) ||
          tech.toLowerCase().includes(templateTech.toLowerCase())
        )
      )
      score += (commonTech.length / userInput.techStack.length) * 25
    }

    // Feature similarity
    if (userInput.features?.length && template.features?.length) {
      const commonFeatures = userInput.features.filter(userFeature =>
        template.features.some(templateFeature =>
          this.calculateStringSimilarity(userFeature, templateFeature) > 0.3
        )
      )
      score += (commonFeatures.length / Math.max(userInput.features.length, template.features.length)) * 20
    }

    // Description similarity
    if (userInput.description && template.description) {
      const similarity = this.calculateStringSimilarity(userInput.description, template.description)
      score += similarity * 15
    }

    // Bonus for popular templates (public templates)
    if (template.is_public) {
      score += 5
    }

    // Bonus for complete templates
    const completeness = this.calculateTemplateCompleteness(template)
    score += completeness * 5

    return Math.round(score)
  }

  private generateMatchReasons(
    template: ContextTemplate,
    userInput: {
      description?: string
      techStack?: string[]
      features?: string[]
      projectType?: string
    }
  ): string[] {
    const reasons: string[] = []

    // Category match
    if (userInput.projectType && template.category === userInput.projectType) {
      reasons.push(`Matches your project type: ${template.category}`)
    }

    // Tech stack matches
    if (userInput.techStack?.length && template.tech_stack) {
      const templateTechStack = Object.keys(template.tech_stack)
      const commonTech = userInput.techStack.filter(tech => 
        templateTechStack.some(templateTech => 
          templateTech.toLowerCase().includes(tech.toLowerCase())
        )
      )
      if (commonTech.length > 0) {
        reasons.push(`Uses similar technologies: ${commonTech.slice(0, 3).join(', ')}`)
      }
    }

    // Feature matches
    if (userInput.features?.length && template.features?.length) {
      const similarFeatures = userInput.features.filter(userFeature =>
        template.features.some(templateFeature =>
          this.calculateStringSimilarity(userFeature, templateFeature) > 0.3
        )
      ).slice(0, 2)
      
      if (similarFeatures.length > 0) {
        reasons.push(`Includes similar features: ${similarFeatures.join(', ')}`)
      }
    }

    // Template quality indicators
    if (template.is_public) {
      reasons.push('Community-verified template')
    }

    if (template.user_stories?.length > 0) {
      reasons.push('Includes detailed user stories')
    }

    if (Object.keys(template.tech_stack).length > 3) {
      reasons.push('Comprehensive tech stack included')
    }

    return reasons.slice(0, 3) // Limit to top 3 reasons
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/)
    const words2 = str2.toLowerCase().split(/\s+/)
    
    const commonWords = words1.filter(word => 
      words2.some(word2 => 
        word.includes(word2) || word2.includes(word) || word === word2
      )
    )
    
    return commonWords.length / Math.max(words1.length, words2.length)
  }

  private calculateTemplateCompleteness(template: ContextTemplate): number {
    let completeness = 0
    const maxScore = 10

    if (template.name?.trim()) completeness += 1
    if (template.description?.trim()) completeness += 1
    if (template.user_stories?.length > 0) completeness += 2
    if (template.features?.length > 0) completeness += 2
    if (Object.keys(template.tech_stack).length > 0) completeness += 2
    if (template.requirements?.trim()) completeness += 1
    if (template.design_preferences?.trim()) completeness += 1

    return completeness / maxScore
  }

  // Template usage analytics
  async getTemplateUsageStats(templateId: string): Promise<{
    usageCount: number
    lastUsed: string | null
    popularTechStack: string[]
    averageProjectSize: string
  }> {
    try {
      // Get projects that used this template
      const { data: projects, error } = await supabase
        .from('projects')
        .select('tech_stack, features, created_at')
        .eq('template_id', templateId)

      if (error) {
        console.error('Error fetching template usage:', error)
        return {
          usageCount: 0,
          lastUsed: null,
          popularTechStack: [],
          averageProjectSize: 'Small'
        }
      }

      const usageCount = projects?.length || 0
      const lastUsed = projects?.length > 0 
        ? new Date(Math.max(...projects.map(p => new Date(p.created_at).getTime()))).toISOString()
        : null

      // Calculate popular tech stack
      const techStackCounts: { [key: string]: number } = {}
      projects?.forEach(project => {
        project.tech_stack?.forEach((tech: string) => {
          techStackCounts[tech] = (techStackCounts[tech] || 0) + 1
        })
      })

      const popularTechStack = Object.entries(techStackCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tech]) => tech)

      // Calculate average project size
      const averageFeatureCount = projects?.reduce((acc, project) => {
        return acc + (project.features?.length || 0)
      }, 0) / (projects?.length || 1)

      let averageProjectSize = 'Small'
      if (averageFeatureCount > 15) {
        averageProjectSize = 'Large'
      } else if (averageFeatureCount > 8) {
        averageProjectSize = 'Medium'
      }

      return {
        usageCount,
        lastUsed,
        popularTechStack,
        averageProjectSize
      }
    } catch (error) {
      console.error('Template usage stats error:', error)
      return {
        usageCount: 0,
        lastUsed: null,
        popularTechStack: [],
        averageProjectSize: 'Small'
      }
    }
  }

  // Create template from existing project
  async createTemplateFromProject(
    userId: string,
    projectId: string,
    templateData: {
      name: string
      category: string
      description: string
      isPublic: boolean
    }
  ): Promise<ContextTemplate | null> {
    try {
      // Get project data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single()

      if (projectError || !project) {
        console.error('Error fetching project for template:', projectError)
        return null
      }

      // Create template from project data
      return await this.createTemplate(userId, {
        name: templateData.name,
        category: templateData.category,
        description: templateData.description,
        tech_stack: project.tech_stack?.reduce((acc: any, tech: string) => {
          acc[tech] = true
          return acc
        }, {}),
        template_data: {
          projectType: project.project_type,
          complexity: project.features?.length > 10 ? 'high' : project.features?.length > 5 ? 'medium' : 'low'
        },
        user_stories: project.user_stories || [],
        features: project.features || [],
        requirements: project.requirements || '',
        design_preferences: project.design_preferences || '',
        deployment_platform: project.deployment_platform || '',
        is_public: templateData.isPublic
      })
    } catch (error) {
      console.error('Create template from project error:', error)
      return null
    }
  }

  // Validate template data
  validateTemplate(template: Partial<ContextTemplate>): { 
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!template.name?.trim()) {
      errors.push('Template name is required')
    }

    if (!template.category?.trim()) {
      errors.push('Template category is required')
    }

    if (!template.description?.trim()) {
      errors.push('Template description is required')
    }

    // Recommendations
    if (!template.user_stories?.length) {
      warnings.push('Adding user stories makes templates more useful')
    }

    if (!template.features?.length) {
      warnings.push('Defining features helps users understand the template scope')
    }

    if (!template.tech_stack || Object.keys(template.tech_stack).length === 0) {
      warnings.push('Including tech stack information guides technology choices')
    }

    if (!template.requirements?.trim()) {
      warnings.push('Technical requirements help users understand complexity')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
} 