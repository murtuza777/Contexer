"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Upload, 
  Save, 
  Edit3,
  Code2,
  Layers,
  Target,
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
  Download
} from 'lucide-react'

interface ProjectContext {
  id: string
  title: string
  description: string
  userStories: string[]
  techStack: string[]
  targetAudience: string
  features: string[]
  requirements: string
  designPreferences: string
  deployment: string
  timeline: string
  lastUpdated: Date
}

const techStackOptions = [
  'Next.js', 'React', 'Vue.js', 'Angular', 'Svelte',
  'Node.js', 'Express', 'NestJS', 'Django', 'FastAPI',
  'Supabase', 'Firebase', 'PostgreSQL', 'MongoDB', 'Redis',
  'Tailwind CSS', 'Chakra UI', 'Material-UI', 'Ant Design',
  'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust'
]

const deploymentOptions = [
  'Vercel', 'Netlify', 'Heroku', 'AWS', 'Google Cloud', 'Azure', 'Railway', 'Render'
]

export default function ContextComposer() {
  const [projectContext, setProjectContext] = useState<ProjectContext>({
    id: '',
    title: '',
    description: '',
    userStories: [''],
    techStack: [],
    targetAudience: '',
    features: [''],
    requirements: '',
    designPreferences: '',
    deployment: '',
    timeline: '',
    lastUpdated: new Date()
  })

  const [savedContexts, setSavedContexts] = useState<ProjectContext[]>([])
  const [selectedContext, setSelectedContext] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    // Load saved contexts from localStorage
    const saved = localStorage.getItem('contexer-contexts')
    if (saved) {
      setSavedContexts(JSON.parse(saved))
    }
  }, [])

  const saveContext = () => {
    const contextToSave = {
      ...projectContext,
      id: projectContext.id || `context-${Date.now()}`,
      lastUpdated: new Date()
    }

    const existingIndex = savedContexts.findIndex(ctx => ctx.id === contextToSave.id)
    let updatedContexts

    if (existingIndex >= 0) {
      updatedContexts = [...savedContexts]
      updatedContexts[existingIndex] = contextToSave
    } else {
      updatedContexts = [...savedContexts, contextToSave]
    }

    setSavedContexts(updatedContexts)
    localStorage.setItem('contexer-contexts', JSON.stringify(updatedContexts))
    setProjectContext(contextToSave)
    setIsEditing(false)
  }

  const loadContext = (contextId: string) => {
    const context = savedContexts.find(ctx => ctx.id === contextId)
    if (context) {
      setProjectContext(context)
      setSelectedContext(contextId)
    }
  }

  const addUserStory = () => {
    setProjectContext(prev => ({
      ...prev,
      userStories: [...prev.userStories, '']
    }))
  }

  const updateUserStory = (index: number, value: string) => {
    setProjectContext(prev => ({
      ...prev,
      userStories: prev.userStories.map((story, i) => i === index ? value : story)
    }))
  }

  const removeUserStory = (index: number) => {
    setProjectContext(prev => ({
      ...prev,
      userStories: prev.userStories.filter((_, i) => i !== index)
    }))
  }

  const addFeature = () => {
    setProjectContext(prev => ({
      ...prev,
      features: [...prev.features, '']
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setProjectContext(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }))
  }

  const removeFeature = (index: number) => {
    setProjectContext(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const toggleTechStack = (tech: string) => {
    setProjectContext(prev => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter(t => t !== tech)
        : [...prev.techStack, tech]
    }))
  }

  const exportContext = () => {
    const dataStr = JSON.stringify(projectContext, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${projectContext.title || 'project-context'}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const isContextComplete = () => {
    return projectContext.title && 
           projectContext.description && 
           projectContext.techStack.length > 0 &&
           projectContext.userStories.some(story => story.trim()) &&
           projectContext.features.some(feature => feature.trim())
  }

  return (
    <div className="h-full bg-white overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Saved Contexts */}
      {savedContexts.length > 0 && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Saved Contexts</CardTitle>
            <CardDescription className="text-gray-600">Load a previously saved project context</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedContexts.map((context) => (
                <div
                  key={context.id}
                  onClick={() => loadContext(context.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedContext === context.id
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <h4 className="font-medium text-gray-900">{context.title || 'Untitled Project'}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {context.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {context.lastUpdated ? new Date(context.lastUpdated).toLocaleDateString() : 'Unknown date'}
                    </span>
                    {context.techStack.length > 0 && (
                      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">
                        {context.techStack.length} tools
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {selectedContext && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => loadContext(selectedContext)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Load Selected Context
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Context Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Overview */}
        <Card className="lg:col-span-2 bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Project Overview</CardTitle>
                <CardDescription className="text-gray-600">Define what you want to build</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-gray-900 font-medium">Project Title</Label>
              <Input
                id="title"
                value={projectContext.title}
                onChange={(e) => setProjectContext(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter your project name"
                className="mt-1 bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-gray-900 font-medium">Description</Label>
              <Textarea
                id="description"
                value={projectContext.description}
                onChange={(e) => setProjectContext(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what you want to build in detail..."
                className="mt-1 min-h-24 bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="audience" className="text-gray-900 font-medium">Target Audience</Label>
              <Input
                id="audience"
                value={projectContext.targetAudience}
                onChange={(e) => setProjectContext(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="Who is this for? (e.g., small businesses, developers, students)"
                className="mt-1 bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="requirements" className="text-gray-900 font-medium">Technical Requirements</Label>
              <Textarea
                id="requirements"
                value={projectContext.requirements}
                onChange={(e) => setProjectContext(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="Any specific technical requirements, integrations, or constraints..."
                className="mt-1 min-h-20 bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="design" className="text-gray-900 font-medium">Design Preferences</Label>
              <Textarea
                id="design"
                value={projectContext.designPreferences}
                onChange={(e) => setProjectContext(prev => ({ ...prev, designPreferences: e.target.value }))}
                placeholder="Describe your preferred design style, colors, layout preferences..."
                className="mt-1 min-h-20 bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deployment" className="text-gray-900 font-medium">Deployment Platform</Label>
                <Select value={projectContext.deployment} onValueChange={(value) => setProjectContext(prev => ({ ...prev, deployment: value }))}>
                  <SelectTrigger className="mt-1 bg-white border-gray-300 text-black">
                    <SelectValue placeholder="Choose deployment platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {deploymentOptions.map((option) => (
                      <SelectItem key={option} value={option} className="text-black hover:bg-gray-100">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeline" className="text-gray-900 font-medium">Timeline</Label>
                <Input
                  id="timeline"
                  value={projectContext.timeline}
                  onChange={(e) => setProjectContext(prev => ({ ...prev, timeline: e.target.value }))}
                  placeholder="e.g., 2 weeks, 1 month"
                  className="mt-1 bg-white border-gray-300 text-black placeholder:text-gray-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tech Stack */}
          <Card className="bg-navy-800 border-navy-700 shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg">Tech Stack</CardTitle>
                  <CardDescription className="text-gray-300 text-sm">Choose your technologies</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {techStackOptions.map((tech) => (
                  <Button
                    key={tech}
                    variant={projectContext.techStack.includes(tech) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleTechStack(tech)}
                    className={
                      projectContext.techStack.includes(tech)
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'border-navy-600 text-gray-300 hover:bg-navy-600'
                    }
                  >
                    {tech}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Context Status */}
          <Card className="bg-navy-800 border-navy-700 shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg">Context Status</CardTitle>
                  <CardDescription className="text-gray-300 text-sm">Project completeness</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Title</span>
                {projectContext.title ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Description</span>
                {projectContext.description ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Tech Stack</span>
                {projectContext.techStack.length > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">User Stories</span>
                {projectContext.userStories.some(story => story.trim()) ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Features</span>
                {projectContext.features.some(feature => feature.trim()) ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Stories & Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Stories */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">User Stories</CardTitle>
                  <CardDescription className="text-gray-600">Define user requirements</CardDescription>
                </div>
              </div>
              <Button
                onClick={addUserStory}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Add Story
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectContext.userStories.map((story, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Textarea
                  value={story}
                  onChange={(e) => updateUserStory(index, e.target.value)}
                  placeholder="As a [user type], I want [goal] so that [benefit]"
                  className="min-h-16 text-sm bg-white border-gray-300 text-black placeholder:text-gray-500"
                />
                <Button
                  onClick={() => removeUserStory(index)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50 mt-1"
                >
                  ×
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Key Features</CardTitle>
                  <CardDescription className="text-gray-600">List main features to build</CardDescription>
                </div>
              </div>
              <Button
                onClick={addFeature}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Add Feature
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectContext.features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Input
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  placeholder="Enter a key feature..."
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                />
                <Button
                  onClick={() => removeFeature(index)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  ×
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
} 