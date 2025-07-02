// Mock data and local storage utilities for VibePilot
// This allows the app to work without database setup

export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'paused' | 'building' | 'error'
  project_type: string
  tech_stack: string[]
  ai_assistant: string
  build_progress: number
  created_at: string
}

export interface AISession {
  id: string
  project_id: string
  session_type: string
  status: string
  ai_assistant: string
  start_time: string
  total_prompts: number
  successful_prompts: number
  errors_fixed: number
}

export interface RecentPrompt {
  id: string
  prompt_type: string
  prompt_text: string
  success: boolean
  response_time_ms: number
  created_at: string
}

// Local Storage Keys
const STORAGE_KEYS = {
  PROJECTS: 'vibepilot_projects',
  SESSIONS: 'vibepilot_sessions', 
  PROMPTS: 'vibepilot_prompts',
  USER: 'vibepilot_user'
}

// Mock User
export const getMockUser = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.USER)
  if (stored) return JSON.parse(stored)
  
  const user = {
    id: 'mock-user-' + Date.now(),
    email: 'demo@vibepilot.com',
    full_name: 'VibePilot Demo User'
  }
  
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  return user
}

// Local Storage Functions
export const getStoredProjects = (): Project[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS)
  return stored ? JSON.parse(stored) : []
}

export const saveProject = (project: Project): void => {
  if (typeof window === 'undefined') return
  const projects = getStoredProjects()
  const existingIndex = projects.findIndex(p => p.id === project.id)
  
  if (existingIndex >= 0) {
    projects[existingIndex] = project
  } else {
    projects.push(project)
  }
  
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
}

export const getStoredSessions = (): AISession[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS)
  return stored ? JSON.parse(stored) : []
}

export const saveSession = (session: AISession): void => {
  if (typeof window === 'undefined') return
  const sessions = getStoredSessions()
  const existingIndex = sessions.findIndex(s => s.id === session.id)
  
  if (existingIndex >= 0) {
    sessions[existingIndex] = session
  } else {
    sessions.push(session)
  }
  
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))
}

export const getStoredPrompts = (): RecentPrompt[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEYS.PROMPTS)
  return stored ? JSON.parse(stored) : []
}

export const savePrompt = (prompt: RecentPrompt): void => {
  if (typeof window === 'undefined') return
  const prompts = getStoredPrompts()
  prompts.unshift(prompt) // Add to beginning
  
  // Keep only last 50 prompts
  if (prompts.length > 50) {
    prompts.splice(50)
  }
  
  localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts))
}

// Sample Data Generator
export const generateSampleData = () => {
  const sampleProjects: Project[] = [
    {
      id: 'sample-1',
      name: 'AI Task Manager',
      description: 'Smart task management with AI categorization and priority suggestions',
      status: 'active',
      project_type: 'web',
      tech_stack: ['Next.js', 'TypeScript', 'Supabase', 'TailwindCSS', 'OpenAI'],
      ai_assistant: 'cursor',
      build_progress: 35,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'sample-2', 
      name: 'Real-time Chat App',
      description: 'Multi-user chat with real-time messaging and file sharing',
      status: 'building',
      project_type: 'web',
      tech_stack: ['React', 'Node.js', 'Socket.io', 'MongoDB', 'Material-UI'],
      ai_assistant: 'windsurf',
      build_progress: 78,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'sample-3',
      name: 'E-commerce Dashboard', 
      description: 'Full-featured admin dashboard for online store management',
      status: 'completed',
      project_type: 'web',
      tech_stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'TailwindCSS'],
      ai_assistant: 'copilot',
      build_progress: 100,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  const sampleSessions: AISession[] = [
    {
      id: 'session-1',
      project_id: 'sample-2',
      session_type: 'build',
      status: 'active',
      ai_assistant: 'windsurf',
      start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      total_prompts: 24,
      successful_prompts: 22,
      errors_fixed: 3
    }
  ]

  const samplePrompts: RecentPrompt[] = [
    {
      id: 'prompt-1',
      prompt_type: 'generate',
      prompt_text: 'Add real-time messaging functionality with Socket.io',
      success: true,
      response_time_ms: 1250,
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 'prompt-2',
      prompt_type: 'fix',
      prompt_text: 'Fix TypeScript compilation error in message component',
      success: true,
      response_time_ms: 890,
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    },
    {
      id: 'prompt-3',
      prompt_type: 'optimize',
      prompt_text: 'Optimize database queries for message history',
      success: true,
      response_time_ms: 2100,
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    }
  ]

  // Save sample data
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(sampleProjects))
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sampleSessions))
  localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(samplePrompts))

  return { sampleProjects, sampleSessions, samplePrompts }
}

// Initialize sample data if none exists
export const initializeSampleData = () => {
  if (typeof window === 'undefined') return
  
  const projects = getStoredProjects()
  if (projects.length === 0) {
    generateSampleData()
  }
} 