// Local AI simulation for VibePilot
// This provides intelligent build plan generation without requiring API keys

export interface BuildTask {
  id: string
  title: string
  description: string
  estimatedTime: string
  dependencies: string[]
  category: 'setup' | 'core' | 'features' | 'polish' | 'deploy'
}

interface ProjectContext {
  description: string
  projectType: string
  techStack: string[]
}

export class LocalAI {
  
  static generateBuildPlan(context: ProjectContext): BuildTask[] {
    const { description, projectType, techStack } = context
    const tasks: BuildTask[] = []
    let taskId = 1

    // 1. Project Setup
    tasks.push({
      id: String(taskId++),
      title: 'Project Initialization',
      description: `Initialize ${projectType} project with ${techStack.slice(0, 3).join(', ')}`,
      estimatedTime: this.estimateTime(projectType, 'setup'),
      dependencies: [],
      category: 'setup'
    })

    // Add framework-specific setup
    if (techStack.includes('Next.js') || techStack.includes('React')) {
      tasks.push({
        id: String(taskId++),
        title: 'React/Next.js Configuration',
        description: 'Configure TypeScript, ESLint, and development environment',
        estimatedTime: '10 minutes',
        dependencies: ['1'],
        category: 'setup'
      })
    }

    if (techStack.includes('Supabase') || techStack.includes('PostgreSQL')) {
      tasks.push({
        id: String(taskId++),
        title: 'Database Setup',
        description: 'Configure database schema, authentication, and RLS policies',
        estimatedTime: '15 minutes',
        dependencies: ['1'],
        category: 'setup'
      })
    }

    // 2. Core Infrastructure
    tasks.push({
      id: String(taskId++),
      title: 'Authentication System',
      description: 'Implement user registration, login, and protected routes',
      estimatedTime: '25 minutes',
      dependencies: tasks.filter(t => t.category === 'setup').map(t => t.id),
      category: 'core'
    })

    tasks.push({
      id: String(taskId++),
      title: 'Core UI Layout',
      description: 'Build navigation, layout components, and routing structure',
      estimatedTime: '20 minutes',
      dependencies: [String(taskId - 1)],
      category: 'core'
    })

    // 3. Feature Implementation (AI-driven based on description)
    const features = this.extractFeatures(description, projectType)
    features.forEach((feature) => {
      tasks.push({
        id: String(taskId++),
        title: feature.title,
        description: feature.description,
        estimatedTime: feature.estimatedTime,
        dependencies: [String(taskId - 2)],
        category: 'features'
      })
    })

    // 4. AI Integration (if detected)
    if (this.detectAIFeatures(description, techStack)) {
      tasks.push({
        id: String(taskId++),
        title: 'AI Integration',
        description: 'Integrate AI APIs, implement smart features, and configure rate limiting',
        estimatedTime: '35 minutes',
        dependencies: tasks.filter(t => t.category === 'features').slice(-1).map(t => t.id),
        category: 'features'
      })
    }

    // 5. Polish & Testing
    tasks.push({
      id: String(taskId++),
      title: 'UI Polish & Animations',
      description: 'Add loading states, micro-interactions, and responsive design',
      estimatedTime: '15 minutes',
      dependencies: tasks.filter(t => t.category === 'features').map(t => t.id),
      category: 'polish'
    })

    tasks.push({
      id: String(taskId++),
      title: 'Testing & Bug Fixes',
      description: 'Write tests, fix bugs, and optimize performance',
      estimatedTime: '20 minutes',
      dependencies: [String(taskId - 1)],
      category: 'polish'
    })

    // 6. Deployment
    tasks.push({
      id: String(taskId++),
      title: 'Production Deployment',
      description: 'Configure deployment pipeline, environment variables, and monitoring',
      estimatedTime: '12 minutes',
      dependencies: [String(taskId - 1)],
      category: 'deploy'
    })

    return tasks
  }

  private static extractFeatures(description: string, projectType: string) {
    const features = []
    const desc = description.toLowerCase()

    // Intelligent feature detection patterns
    const featurePatterns = [
      {
        keywords: ['task', 'todo', 'manage', 'organize'],
        feature: {
          title: 'Task Management System',
          description: 'Create, read, update, delete tasks with categories and priorities',
          estimatedTime: '30 minutes'
        }
      },
      {
        keywords: ['chat', 'messaging', 'communication', 'real-time'],
        feature: {
          title: 'Real-time Communication',
          description: 'Implement live messaging with Socket.io and message history',
          estimatedTime: '40 minutes'
        }
      },
      {
        keywords: ['dashboard', 'analytics', 'metrics', 'chart'],
        feature: {
          title: 'Analytics Dashboard',
          description: 'Build interactive charts and data visualization components',
          estimatedTime: '35 minutes'
        }
      },
      {
        keywords: ['upload', 'file', 'image', 'document'],
        feature: {
          title: 'File Management',
          description: 'Implement file upload, preview, and cloud storage integration',
          estimatedTime: '25 minutes'
        }
      },
      {
        keywords: ['payment', 'subscription', 'billing', 'stripe'],
        feature: {
          title: 'Payment Processing',
          description: 'Integrate payment gateway and subscription management',
          estimatedTime: '45 minutes'
        }
      },
      {
        keywords: ['search', 'filter', 'find'],
        feature: {
          title: 'Search & Filtering',
          description: 'Implement full-text search with advanced filtering options',
          estimatedTime: '20 minutes'
        }
      },
      {
        keywords: ['social', 'share', 'comment', 'like'],
        feature: {
          title: 'Social Features',
          description: 'Add commenting, sharing, and user interaction features',
          estimatedTime: '30 minutes'
        }
      },
      {
        keywords: ['notification', 'alert', 'remind'],
        feature: {
          title: 'Notification System',
          description: 'Build push notifications and email alert system',
          estimatedTime: '25 minutes'
        }
      }
    ]

    // Match features based on description
    featurePatterns.forEach(pattern => {
      if (pattern.keywords.some(keyword => desc.includes(keyword))) {
        features.push(pattern.feature)
      }
    })

    // Default feature if none detected
    if (features.length === 0) {
      features.push({
        title: 'Core Application Features',
        description: 'Implement main functionality based on project requirements',
        estimatedTime: '45 minutes'
      })
    }

    return features
  }

  private static detectAIFeatures(description: string, techStack: string[]): boolean {
    const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'smart', 'intelligent', 'gpt', 'openai']
    const hasAIKeywords = aiKeywords.some(keyword => description.toLowerCase().includes(keyword))
    const hasAIStack = techStack.some(tech => 
      ['OpenAI', 'Langchain', 'Pinecone', 'Hugging Face'].includes(tech)
    )
    
    return hasAIKeywords || hasAIStack
  }

  private static estimateTime(projectType: string, category: string): string {
    const timeMatrix = {
      web: {
        setup: '15 minutes',
        core: '25 minutes',
        features: '35 minutes',
        polish: '20 minutes',
        deploy: '12 minutes'
      },
      mobile: {
        setup: '20 minutes',
        core: '30 minutes',
        features: '45 minutes',
        polish: '25 minutes',
        deploy: '15 minutes'
      },
      api: {
        setup: '12 minutes',
        core: '20 minutes',
        features: '30 minutes',
        polish: '15 minutes',
        deploy: '10 minutes'
      }
    }

    return timeMatrix[projectType as keyof typeof timeMatrix]?.[category] || '20 minutes'
  }

  static generateSmartPrompt(taskTitle: string, taskDescription: string, techStack: string[]): string {
    const prompts = [
      `Create ${taskTitle.toLowerCase()}: ${taskDescription}. Use ${techStack.slice(0, 3).join(', ')} and follow best practices.`,
      `Implement ${taskTitle} with the following requirements: ${taskDescription}. Ensure compatibility with ${techStack.join(', ')}.`,
      `Build ${taskTitle.toLowerCase()} feature: ${taskDescription}. Focus on clean code and ${techStack.includes('TypeScript') ? 'type safety' : 'documentation'}.`,
      `Develop ${taskTitle}: ${taskDescription}. Optimize for performance and use ${techStack.slice(0, 2).join(' and ')}.`
    ]

    return prompts[Math.floor(Math.random() * prompts.length)]
  }
}

export function generateLocalBuildPlan(
  description: string,
  projectType: string,
  techStack: string[]
): BuildTask[] {
  const tasks: BuildTask[] = []
  let taskId = 1

  // Project setup
  tasks.push({
    id: String(taskId++),
    title: 'Project Setup',
    description: `Initialize ${projectType} project with ${techStack.slice(0, 3).join(', ')}`,
    estimatedTime: '15 minutes',
    dependencies: [],
    category: 'setup'
  })

  // Core features based on description
  if (description.toLowerCase().includes('task') || description.toLowerCase().includes('todo')) {
    tasks.push({
      id: String(taskId++),
      title: 'Task Management',
      description: 'Create task CRUD operations with categories',
      estimatedTime: '30 minutes',
      dependencies: ['1'],
      category: 'features'
    })
  }

  if (description.toLowerCase().includes('chat') || description.toLowerCase().includes('messaging')) {
    tasks.push({
      id: String(taskId++),
      title: 'Real-time Chat',
      description: 'Implement messaging with Socket.io',
      estimatedTime: '40 minutes',
      dependencies: ['1'],
      category: 'features'
    })
  }

  // Default core functionality
  tasks.push({
    id: String(taskId++),
    title: 'Authentication',
    description: 'User registration and login system',
    estimatedTime: '25 minutes',
    dependencies: ['1'],
    category: 'core'
  })

  tasks.push({
    id: String(taskId++),
    title: 'UI Components',
    description: 'Build main interface components',
    estimatedTime: '20 minutes',
    dependencies: [String(taskId - 1)],
    category: 'core'
  })

  // Polish and deploy
  tasks.push({
    id: String(taskId++),
    title: 'Polish & Testing',
    description: 'Add animations and fix bugs',
    estimatedTime: '15 minutes',
    dependencies: [String(taskId - 1)],
    category: 'polish'
  })

  tasks.push({
    id: String(taskId++),
    title: 'Deployment',
    description: 'Deploy to production',
    estimatedTime: '10 minutes',
    dependencies: [String(taskId - 1)],
    category: 'deploy'
  })

  return tasks
} 