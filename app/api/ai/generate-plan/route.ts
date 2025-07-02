import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { generateLocalBuildPlan, type BuildTask } from '@/lib/local-ai'

export async function POST(request: NextRequest) {
  try {
    const { description, projectType, techStack } = await request.json()
    
    // Get user from session
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate build plan using local AI
    const buildPlan = generateLocalBuildPlan(description, projectType, techStack)
    
    return NextResponse.json({ 
      success: true, 
      buildPlan,
      message: 'Build plan generated successfully'
    })

  } catch (error) {
    console.error('Build plan generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate build plan' },
      { status: 500 }
    )
  }
}

async function generateBuildPlan(
  description: string, 
  projectType: string, 
  techStack: string[]
): Promise<BuildTask[]> {
  
  // In a real implementation, this would call OpenAI/Claude API
  // For now, we'll generate a smart template based on the inputs
  
  const baseTasks: BuildTask[] = []
  let taskId = 1

  // 1. Setup Tasks
  baseTasks.push({
    id: String(taskId++),
    title: 'Project Initialization',
    description: `Initialize ${projectType} project with ${techStack.join(', ')} and configure development environment`,
    estimatedTime: '15 minutes',
    dependencies: [],
    category: 'setup'
  })

  if (techStack.includes('Next.js') || techStack.includes('React')) {
    baseTasks.push({
      id: String(taskId++),
      title: 'Install Frontend Dependencies',
      description: 'Set up React/Next.js with TypeScript, install UI libraries and configure build tools',
      estimatedTime: '10 minutes',
      dependencies: ['1'],
      category: 'setup'
    })
  }

  if (techStack.includes('Supabase') || techStack.includes('PostgreSQL')) {
    baseTasks.push({
      id: String(taskId++),
      title: 'Database Setup',
      description: 'Configure database connection, set up authentication tables and implement RLS policies',
      estimatedTime: '20 minutes',
      dependencies: ['1'],
      category: 'setup'
    })
  }

  // 2. Core Infrastructure
  baseTasks.push({
    id: String(taskId++),
    title: 'Authentication System',
    description: 'Implement user registration, login, logout, and protected routes',
    estimatedTime: '30 minutes',
    dependencies: baseTasks.filter(t => t.category === 'setup').map(t => t.id),
    category: 'core'
  })

  baseTasks.push({
    id: String(taskId++),
    title: 'Core UI Layout',
    description: 'Build main navigation, dashboard layout, and responsive design foundation',
    estimatedTime: '25 minutes',
    dependencies: [String(taskId - 1)],
    category: 'core'
  })

  // 3. Feature Implementation (based on description)
  const features = extractFeatures(description, projectType)
  features.forEach((feature, index) => {
    baseTasks.push({
      id: String(taskId++),
      title: feature.title,
      description: feature.description,
      estimatedTime: feature.estimatedTime,
      dependencies: [String(taskId - 2)], // Depends on previous task
      category: 'features'
    })
  })

  // 4. AI Integration (if mentioned)
  if (description.toLowerCase().includes('ai') || techStack.includes('OpenAI')) {
    baseTasks.push({
      id: String(taskId++),
      title: 'AI Integration',
      description: 'Integrate AI APIs, implement intelligent features and configure API rate limiting',
      estimatedTime: '45 minutes',
      dependencies: baseTasks.filter(t => t.category === 'features').slice(-1).map(t => t.id),
      category: 'features'
    })
  }

  // 5. Polish & Optimization
  baseTasks.push({
    id: String(taskId++),
    title: 'UI Polish & Animations',
    description: 'Add loading states, animations, error handling, and responsive design improvements',
    estimatedTime: '20 minutes',
    dependencies: baseTasks.filter(t => t.category === 'features').map(t => t.id),
    category: 'polish'
  })

  baseTasks.push({
    id: String(taskId++),
    title: 'Testing & Bug Fixes',
    description: 'Add unit tests, integration tests, and fix any discovered bugs',
    estimatedTime: '25 minutes',
    dependencies: [String(taskId - 1)],
    category: 'polish'
  })

  // 6. Deployment
  baseTasks.push({
    id: String(taskId++),
    title: 'Production Deployment',
    description: 'Configure production environment, deploy to Vercel/Netlify, and set up monitoring',
    estimatedTime: '15 minutes',
    dependencies: [String(taskId - 1)],
    category: 'deploy'
  })

  return baseTasks
}

function extractFeatures(description: string, projectType: string) {
  const features = []
  const desc = description.toLowerCase()

  // Common feature patterns
  if (desc.includes('task') || desc.includes('todo')) {
    features.push({
      title: 'Task Management System',
      description: 'Create, read, update, delete tasks with categories and due dates',
      estimatedTime: '40 minutes'
    })
  }

  if (desc.includes('chat') || desc.includes('messaging')) {
    features.push({
      title: 'Real-time Chat System',
      description: 'Implement real-time messaging with Socket.io and message history',
      estimatedTime: '50 minutes'
    })
  }

  if (desc.includes('dashboard') || desc.includes('analytics')) {
    features.push({
      title: 'Analytics Dashboard',
      description: 'Create interactive charts and data visualization components',
      estimatedTime: '35 minutes'
    })
  }

  if (desc.includes('upload') || desc.includes('file')) {
    features.push({
      title: 'File Upload System',
      description: 'Implement file upload, preview, and cloud storage integration',
      estimatedTime: '30 minutes'
    })
  }

  if (desc.includes('payment') || desc.includes('subscription')) {
    features.push({
      title: 'Payment Integration',
      description: 'Integrate Stripe for subscriptions and payment processing',
      estimatedTime: '45 minutes'
    })
  }

  if (desc.includes('search')) {
    features.push({
      title: 'Search Functionality',
      description: 'Implement full-text search with filters and sorting options',
      estimatedTime: '25 minutes'
    })
  }

  // Default features if none detected
  if (features.length === 0) {
    features.push({
      title: 'Core Feature Implementation',
      description: 'Implement main application features based on project requirements',
      estimatedTime: '60 minutes'
    })
  }

  return features
} 