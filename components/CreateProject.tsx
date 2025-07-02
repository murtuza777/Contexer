"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Plus, Sparkles, FileText, Wand2, Loader2, CheckCircle2, Upload } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import { saveProject, getMockUser } from '@/lib/mock-data'

interface CreateProjectProps {
  onProjectCreated: () => void
  onCancel: () => void
}

interface BuildTask {
  id: string
  title: string
  description: string
  estimatedTime: string
  dependencies: string[]
  category: 'setup' | 'core' | 'features' | 'polish' | 'deploy'
}

const AI_ASSISTANTS = [
  { value: 'cursor', label: 'Cursor', description: 'Advanced AI pair programmer' },
  { value: 'copilot', label: 'GitHub Copilot', description: 'AI coding assistant by GitHub' },
  { value: 'windsurf', label: 'WindSurf', description: 'AI-powered development environment' },
  { value: 'codeium', label: 'Codeium', description: 'Free AI code completion' },
  { value: 'tabnine', label: 'Tabnine', description: 'AI code completions' }
]

const PROJECT_TYPES = [
  { value: 'web', label: 'Web App', description: 'React, Next.js, Vue, etc.', icon: '🌐' },
  { value: 'mobile', label: 'Mobile App', description: 'React Native, Flutter', icon: '📱' },
  { value: 'api', label: 'API/Backend', description: 'REST, GraphQL, microservices', icon: '🔧' },
  { value: 'desktop', label: 'Desktop App', description: 'Electron, Tauri', icon: '💻' },
  { value: 'ai', label: 'AI/ML Project', description: 'Machine learning, AI models', icon: '🤖' },
  { value: 'other', label: 'Other', description: 'Custom project type', icon: '⚡' }
]

const TECH_STACK_CATEGORIES = {
  frontend: ['React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'TypeScript', 'JavaScript'],
  backend: ['Node.js', 'Python', 'Express', 'FastAPI', 'Django', 'Flask', 'NestJS'],
  mobile: ['React Native', 'Flutter', 'Expo', 'Ionic'],
  database: ['PostgreSQL', 'MongoDB', 'MySQL', 'Supabase', 'Firebase', 'Prisma'],
  styling: ['TailwindCSS', 'Material-UI', 'Chakra UI', 'Styled Components', 'CSS Modules'],
  deployment: ['Vercel', 'Netlify', 'AWS', 'Google Cloud', 'Docker', 'Railway'],
  ai: ['OpenAI', 'Langchain', 'Pinecone', 'Hugging Face', 'TensorFlow', 'PyTorch']
}

const PROJECT_TEMPLATES = [
  {
    name: "AI Task Manager",
    description: "Smart task management with AI categorization and priority suggestions",
    type: "web",
    stack: ["Next.js", "TypeScript", "Supabase", "TailwindCSS", "OpenAI"],
    features: ["AI task categorization", "Smart notifications", "Progress tracking"]
  },
  {
    name: "Real-time Chat App",
    description: "Multi-user chat with real-time messaging and file sharing",
    type: "web", 
    stack: ["React", "Node.js", "Socket.io", "MongoDB", "Material-UI"],
    features: ["Real-time messaging", "File uploads", "User authentication"]
  },
  {
    name: "E-commerce Dashboard",
    description: "Full-featured admin dashboard for online store management",
    type: "web",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "TailwindCSS"],
    features: ["Inventory management", "Analytics", "Order processing"]
  }
]

export default function CreateProject({ onProjectCreated, onCancel }: CreateProjectProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('manual')
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectType: '',
    aiAssistant: 'cursor',
    repositoryUrl: '',
    localPath: ''
  })
  const [techStack, setTechStack] = useState<string[]>([])
  const [buildPlan, setBuildPlan] = useState<BuildTask[]>([])
  const [customTech, setCustomTech] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [error, setError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<typeof PROJECT_TEMPLATES[0] | null>(null)

  const supabase = createClient()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const addTechStack = (tech: string) => {
    if (tech && !techStack.includes(tech)) {
      setTechStack(prev => [...prev, tech])
    }
    setCustomTech('')
  }

  const removeTechStack = (tech: string) => {
    setTechStack(prev => prev.filter(t => t !== tech))
  }

  const generateProjectIdea = async () => {
    const ideas = [
      "AI-powered task management app with smart scheduling and natural language input",
      "Real-time collaborative code editor with video chat and AI code suggestions",
      "Smart expense tracker with receipt OCR and automatic categorization using AI",
      "Social fitness app with AR workout tracking and personalized AI coaching",
      "AI language learning platform with conversation practice and pronunciation feedback",
      "Smart home automation dashboard with energy optimization and predictive analytics",
      "Blockchain-based decentralized social media platform with content moderation AI",
      "AI-powered meal planning app with nutrition tracking and recipe generation",
      "Real-time multiplayer strategy game with AI opponents and adaptive difficulty",
      "Smart investment portfolio manager with AI-driven risk analysis and predictions"
    ]
    
    const randomIdea = ideas[Math.floor(Math.random() * ideas.length)]
    setFormData(prev => ({ ...prev, description: randomIdea }))
    
    // Auto-suggest tech stack based on the idea
    if (randomIdea.includes('AI') || randomIdea.includes('smart')) {
      setTechStack(['Next.js', 'TypeScript', 'OpenAI', 'Supabase', 'TailwindCSS'])
    }
  }

  const generateBuildPlan = async () => {
    if (!formData.description || !formData.projectType) {
      setError('Please fill in project description and type first')
      return
    }

    setGeneratingPlan(true)
    
    try {
      // Call AI API to generate build plan
      const response = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          projectType: formData.projectType,
          techStack: techStack
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate build plan')
      }

      const data = await response.json()
      setBuildPlan(data.buildPlan || [])
      setCurrentStep(3)
      
    } catch (err) {
      console.error('Failed to generate build plan:', err)
      // Fallback to sample build plan
      const samplePlan: BuildTask[] = [
        {
          id: '1',
          title: 'Project Setup & Configuration',
          description: 'Initialize project structure, install dependencies, configure environment',
          estimatedTime: '15 minutes',
          dependencies: [],
          category: 'setup'
        },
        {
          id: '2', 
          title: 'Authentication System',
          description: 'Set up user authentication with login/signup forms',
          estimatedTime: '30 minutes',
          dependencies: ['1'],
          category: 'core'
        },
        {
          id: '3',
          title: 'Core UI Components',
          description: 'Build main dashboard and navigation components',
          estimatedTime: '45 minutes', 
          dependencies: ['2'],
          category: 'core'
        },
        {
          id: '4',
          title: 'Main Features Implementation',
          description: 'Implement core functionality based on project requirements',
          estimatedTime: '1-2 hours',
          dependencies: ['3'],
          category: 'features'
        },
        {
          id: '5',
          title: 'Styling & Polish',
          description: 'Apply consistent styling, animations, and responsive design',
          estimatedTime: '30 minutes',
          dependencies: ['4'],
          category: 'polish'
        },
        {
          id: '6',
          title: 'Testing & Deployment',
          description: 'Add tests, fix bugs, and deploy to production',
          estimatedTime: '20 minutes',
          dependencies: ['5'],
          category: 'deploy'
        }
      ]
      setBuildPlan(samplePlan)
      setCurrentStep(3)
    } finally {
      setGeneratingPlan(false)
    }
  }

  const useTemplate = (template: typeof PROJECT_TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      projectType: template.type
    }))
    setTechStack(template.stack)
    setSelectedTemplate(template)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Project name is required')
      return
    }
    
    if (!formData.projectType) {
      setError('Please select a project type')
      return
    }
    
    if (!formData.aiAssistant) {
      setError('Please select an AI assistant')
      return
    }

    setLoading(true)
    
    try {
      const currentUser = user || getMockUser()
      
      // Create project object
      const newProject = {
        id: 'project-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        user_id: currentUser.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        project_type: formData.projectType,
        tech_stack: techStack,
        repository_url: formData.repositoryUrl.trim() || null,
        local_path: formData.localPath.trim() || null,
        ai_assistant: formData.aiAssistant,
        status: 'active' as const,
        build_progress: 0,
        created_at: new Date().toISOString()
      }

      // Save to local storage
      saveProject(newProject)

      // Save build plan if generated (to local storage for now)
      if (buildPlan.length > 0) {
        localStorage.setItem(`build-plan-${newProject.id}`, JSON.stringify(buildPlan, null, 2))
      }

      console.log('✅ Project created successfully:', newProject)
      onProjectCreated()
      
    } catch (err) {
      console.error('❌ Failed to create project:', err)
      setError('Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: BuildTask['category']) => {
    switch (category) {
      case 'setup': return '⚙️'
      case 'core': return '🏗️'
      case 'features': return '✨'
      case 'polish': return '🎨'
      case 'deploy': return '🚀'
      default: return '📋'
    }
  }

  const getCategoryColor = (category: BuildTask['category']) => {
    switch (category) {
      case 'setup': return 'bg-blue-500/20 text-blue-300'
      case 'core': return 'bg-green-500/20 text-green-300'
      case 'features': return 'bg-purple-500/20 text-purple-300'
      case 'polish': return 'bg-pink-500/20 text-pink-300'
      case 'deploy': return 'bg-orange-500/20 text-orange-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-slate-950/95 border-white/20 backdrop-blur-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center">
              <Sparkles className="w-6 h-6 mr-2" />
              Create New VibePilot Project
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCancel}
              className="text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
          <CardDescription className="text-white/70">
            VibePilot will build your project autonomously. Just describe what you want!
          </CardDescription>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4 mt-6">
            {[
              { num: 1, label: 'Project Info' },
              { num: 2, label: 'Tech Stack' },
              { num: 3, label: 'Build Plan' },
              { num: 4, label: 'Start Build' }
            ].map((step, index) => (
              <div key={step.num} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step.num 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/20 text-white/50'
                  }
                `}>
                  {currentStep > step.num ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                </div>
                <span className="ml-2 text-white/70 text-sm">{step.label}</span>
                {index < 3 && (
                  <div className={`
                    w-8 h-0.5 ml-4
                    ${currentStep > step.num ? 'bg-blue-500' : 'bg-white/20'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger value="manual" className="text-white data-[state=active]:bg-blue-500">
                Manual Setup
              </TabsTrigger>
              <TabsTrigger value="template" className="text-white data-[state=active]:bg-blue-500">
                Use Template
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="template" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PROJECT_TEMPLATES.map((template) => (
                  <Card 
                    key={template.name}
                    className={`
                      bg-white/10 border-white/20 cursor-pointer transition-all hover:bg-white/20
                      ${selectedTemplate?.name === template.name ? 'border-blue-500 bg-blue-500/20' : ''}
                    `}
                    onClick={() => useTemplate(template)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-white/70 text-sm">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.stack.slice(0, 3).map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {template.stack.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.stack.length - 3}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {template.features.slice(0, 2).map((feature) => (
                          <div key={feature} className="text-white/60 text-xs flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-green-400" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="manual">
              <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Project Name */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Project Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter project name..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            {/* Project Description */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Project Description
              </label>
              <div className="relative">
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what you want to build..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateProjectIdea}
                  className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Generate Idea
                </Button>
              </div>
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Project Type *
              </label>
              <Select value={formData.projectType} onValueChange={(value) => handleInputChange('projectType', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select project type..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/20">
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-white/70">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Assistant */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                AI Assistant *
              </label>
              <Select value={formData.aiAssistant} onValueChange={(value) => handleInputChange('aiAssistant', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select AI assistant..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/20">
                  {AI_ASSISTANTS.map((assistant) => (
                    <SelectItem key={assistant.value} value={assistant.value} className="text-white">
                      <div>
                        <div className="font-medium">{assistant.label}</div>
                        <div className="text-sm text-white/70">{assistant.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tech Stack */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Tech Stack
              </label>
              
              {/* Selected Technologies */}
              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {techStack.map((tech) => (
                    <Badge 
                      key={tech} 
                      variant="outline" 
                      className="text-white border-white/30 bg-white/10"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTechStack(tech)}
                        className="ml-2 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Popular Technologies */}
              <div className="mb-3">
                <p className="text-white/70 text-sm mb-2">Popular technologies:</p>
                <div className="flex flex-wrap gap-2">
                  {TECH_STACK_CATEGORIES.frontend.filter(tech => !techStack.includes(tech)).slice(0, 12).map((tech) => (
                    <Button
                      key={tech}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTechStack(tech)}
                      className="text-white/70 border-white/20 hover:bg-white/10 hover:text-white"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {tech}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Custom Technology Input */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={customTech}
                  onChange={(e) => setCustomTech(e.target.value)}
                  placeholder="Add custom technology..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTechStack(customTech)
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addTechStack(customTech)}
                  disabled={!customTech.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Repository URL */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Repository URL (Optional)
              </label>
              <Input
                type="url"
                value={formData.repositoryUrl}
                onChange={(e) => handleInputChange('repositoryUrl', e.target.value)}
                placeholder="https://github.com/username/repo"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            {/* Local Path */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Local Path (Optional)
              </label>
              <Input
                type="text"
                value={formData.localPath}
                onChange={(e) => handleInputChange('localPath', e.target.value)}
                placeholder="/path/to/project"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 text-white border-white/30 hover:bg-white/10"
              >
                Cancel
              </Button>
              
              {currentStep < 3 && (
                <Button
                  type="button"
                  onClick={() => {
                    if (currentStep === 1 && formData.name && formData.projectType) {
                      setCurrentStep(2)
                    } else if (currentStep === 2) {
                      generateBuildPlan()
                    }
                  }}
                  disabled={generatingPlan || (currentStep === 1 && (!formData.name || !formData.projectType))}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {generatingPlan ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    currentStep === 1 ? 'Next: Tech Stack' : 'Generate Build Plan'
                  )}
                </Button>
              )}
              
              {currentStep === 3 && (
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Building!
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
          
          {/* Build Plan Preview */}
          {buildPlan.length > 0 && (
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-white font-medium mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                AI-Generated Build Plan ({buildPlan.length} tasks)
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {buildPlan.map((task, index) => (
                  <div key={task.id} className="flex items-start space-x-3 p-3 bg-white/5 rounded border border-white/10">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-medium text-sm">{task.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={getCategoryColor(task.category)}>
                            {getCategoryIcon(task.category)} {task.category}
                          </Badge>
                          <span className="text-white/60 text-xs">{task.estimatedTime}</span>
                        </div>
                      </div>
                      <p className="text-white/70 text-xs">{task.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
</div>
  )
} 