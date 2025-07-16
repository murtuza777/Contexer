"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { useContextComposer, ProjectContext, ContextTemplate } from '@/hooks/useContextComposer'
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
  Download,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  AlertCircle,
  Info,
  Zap,
  Layout,
  History,
  Search,
  Filter,
  X,
  FileUp,
  Check
} from 'lucide-react'

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

// Mock user ID - in a real app, this would come from authentication
// Using a valid UUID format to prevent database errors
const MOCK_USER_ID = 'b47ac10b-58cc-4372-a567-0e02b2c3d479'

export default function ContextComposer() {
  const { toast } = useToast()
  const {
    contexts,
    templates,
    currentContext,
    loading,
    saving,
    error,
    createContext,
    updateContext,
    deleteContext,
    loadContext,
    setCurrentContext,
    loadTemplates,
    applyTemplate,
    uploadFile,
    deleteFile,
    validateContext,
    getCompletionStatus,
    exportContext,
    importContext
  } = useContextComposer(MOCK_USER_ID)

  // Local state
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showTemplates, setShowTemplates] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form state for new/edit context
  const [formData, setFormData] = useState<Partial<ProjectContext>>({
    name: '',
    description: '',
    user_stories: [''],
    tech_stack: [],
    target_audience: '',
    features: [''],
    requirements: '',
    design_preferences: '',
    deployment_platform: '',
    timeline: ''
  })

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, []) // Empty dependency array to prevent infinite re-renders

  // Update form data when current context changes
  useEffect(() => {
    if (currentContext) {
      setFormData({
        name: currentContext.name,
        description: currentContext.description,
        user_stories: currentContext.user_stories?.length > 0 ? currentContext.user_stories : [''],
        tech_stack: currentContext.tech_stack || [],
        target_audience: currentContext.target_audience,
        features: currentContext.features?.length > 0 ? currentContext.features : [''],
        requirements: currentContext.requirements,
        design_preferences: currentContext.design_preferences,
        deployment_platform: currentContext.deployment_platform,
        timeline: currentContext.timeline
      })
    }
  }, [currentContext])

  // Handle form field updates
  const updateFormField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Handle array field updates (user stories, features)
  const updateArrayField = useCallback((field: 'user_stories' | 'features', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.map((item, i) => i === index ? value : item) || []
    }))
  }, [])

  const addArrayItem = useCallback((field: 'user_stories' | 'features') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }))
  }, [])

  const removeArrayItem = useCallback((field: 'user_stories' | 'features', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }))
  }, [])

  // Handle tech stack toggle
  const toggleTechStack = useCallback((tech: string) => {
    setFormData(prev => ({
      ...prev,
      tech_stack: prev.tech_stack?.includes(tech)
        ? prev.tech_stack.filter(t => t !== tech)
        : [...(prev.tech_stack || []), tech]
    }))
  }, [])

  // Save context
  const handleSave = useCallback(async () => {
    const validation = validateContext(formData)
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors[0],
        variant: "destructive"
      })
      return
    }

    let result
    if (currentContext) {
      result = await updateContext(currentContext.id, formData)
    } else {
      result = await createContext(formData)
    }

    if (result) {
      toast({
        title: "Success",
        description: currentContext ? "Context updated successfully" : "Context created successfully"
      })
    }
  }, [formData, currentContext, validateContext, updateContext, createContext, toast])

  // Create new context
  const handleNewContext = useCallback(() => {
    setCurrentContext(null)
    setFormData({
      name: '',
      description: '',
      user_stories: [''],
      tech_stack: [],
      target_audience: '',
      features: [''],
      requirements: '',
      design_preferences: '',
      deployment_platform: '',
      timeline: ''
    })
  }, [setCurrentContext])

  // Load existing context
  const handleLoadContext = useCallback(async (contextId: string) => {
    await loadContext(contextId)
  }, [loadContext])

  // Delete context
  const handleDeleteContext = useCallback(async (contextId: string) => {
    const success = await deleteContext(contextId)
    if (success) {
      toast({
        title: "Success",
        description: "Context deleted successfully"
      })
      if (currentContext?.id === contextId) {
        handleNewContext()
      }
    }
  }, [deleteContext, currentContext, handleNewContext, toast])

  // Apply template
  const handleApplyTemplate = useCallback(async (templateId: string) => {
    const result = await applyTemplate(templateId, currentContext?.id)
    if (result) {
      toast({
        title: "Template Applied",
        description: "Template has been applied to your context"
      })
      setShowTemplates(false)
    }
  }, [applyTemplate, currentContext, toast])

  // File upload handling
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !currentContext) return

    const file = files[0]
    if (!file.name.toLowerCase().endsWith('.md') && !file.name.toLowerCase().endsWith('.txt')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload only .md or .txt files",
        variant: "destructive"
      })
      return
    }

    setUploadProgress(0)
    try {
      const result = await uploadFile(file, currentContext.id)
      if (result) {
        setUploadProgress(100)
        toast({
          title: "File Uploaded",
          description: "File processed successfully. Check suggestions below."
        })
        
        // Apply suggestions if available
        if (result.suggestions?.length > 0) {
          toast({
            title: "Processing Complete",
            description: `Found ${result.suggestions.length} suggestions from your file`
          })
        }
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }, [currentContext, uploadFile, toast])

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [handleFileUpload])

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  // Get completion status
  const completionStatus = currentContext ? getCompletionStatus(currentContext) : { percentage: 0, missingFields: [] }

  // Show error if any
  if (error) {
    toast({
      title: "Error",
      description: error,
      variant: "destructive"
    })
  }

  return (
    <div className="h-full bg-white overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Context Composer</h1>
              <p className="text-gray-600">Define your project vision and requirements</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowTemplates(true)}
              className="text-purple-600 border-purple-300"
            >
              <Layout className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button
              variant="outline"
              onClick={handleNewContext}
              className="text-blue-600 border-blue-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {currentContext ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>

      {/* Saved Contexts */}
        {contexts.length > 0 && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
              <CardTitle className="text-gray-900">Your Projects</CardTitle>
              <CardDescription className="text-gray-600">
                {contexts.length} project{contexts.length !== 1 ? 's' : ''} created
              </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contexts.map((context) => {
                  const status = getCompletionStatus(context)
                  return (
                <div
                  key={context.id}
                      onClick={() => handleLoadContext(context.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        currentContext?.id === context.id
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 line-clamp-1">{context.name}</h4>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Project</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{context.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteContext(context.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {context.description || 'No description'}
                  </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Completion</span>
                          <span className="text-xs font-medium text-gray-700">{status.percentage}%</span>
                        </div>
                        <Progress value={status.percentage} className="h-1" />
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-gray-200 text-gray-700"
                        >
                          {context.tech_stack?.length || 0} technologies
                        </Badge>
                    <span className="text-xs text-gray-500">
                          {new Date(context.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                  )
                })}
              </div>
          </CardContent>
        </Card>
      )}

      {/* Main Context Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Overview */}
        <Card className="lg:col-span-2 bg-white border-gray-200 shadow-sm">
          <CardHeader>
              <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Project Overview</CardTitle>
                <CardDescription className="text-gray-600">Define what you want to build</CardDescription>
              </div>
                </div>
                
                {currentContext && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportContext(currentContext)}
                      className="text-gray-600"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
                )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-gray-900 font-medium">Project Title</Label>
              <Input
                id="title"
                  value={formData.name || ''}
                  onChange={(e) => updateFormField('name', e.target.value)}
                placeholder="Enter your project name"
                className="mt-1 bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-gray-900 font-medium">Description</Label>
              <Textarea
                id="description"
                  value={formData.description || ''}
                  onChange={(e) => updateFormField('description', e.target.value)}
                placeholder="Describe what you want to build in detail..."
                className="mt-1 min-h-24 bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="audience" className="text-gray-900 font-medium">Target Audience</Label>
              <Input
                id="audience"
                  value={formData.target_audience || ''}
                  onChange={(e) => updateFormField('target_audience', e.target.value)}
                placeholder="Who is this for? (e.g., small businesses, developers, students)"
                className="mt-1 bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="requirements" className="text-gray-900 font-medium">Technical Requirements</Label>
              <Textarea
                id="requirements"
                  value={formData.requirements || ''}
                  onChange={(e) => updateFormField('requirements', e.target.value)}
                placeholder="Any specific technical requirements, integrations, or constraints..."
                className="mt-1 min-h-20 bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="design" className="text-gray-900 font-medium">Design Preferences</Label>
              <Textarea
                id="design"
                  value={formData.design_preferences || ''}
                  onChange={(e) => updateFormField('design_preferences', e.target.value)}
                placeholder="Describe your preferred design style, colors, layout preferences..."
                className="mt-1 min-h-20 bg-white border-gray-300 text-black placeholder:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deployment" className="text-gray-900 font-medium">Deployment Platform</Label>
                  <Select 
                    value={formData.deployment_platform || ''} 
                    onValueChange={(value) => updateFormField('deployment_platform', value)}
                  >
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
                    value={formData.timeline || ''}
                    onChange={(e) => updateFormField('timeline', e.target.value)}
                  placeholder="e.g., 2 weeks, 1 month"
                  className="mt-1 bg-white border-gray-300 text-black placeholder:text-gray-500"
                />
              </div>
            </div>

              {/* File Upload Section */}
              {currentContext && (
                <div>
                  <Label className="text-gray-900 font-medium">Upload Project Files</Label>
                  <div
                    className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      dragActive 
                        ? 'border-emerald-400 bg-emerald-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <FileUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop README.md or .txt files here, or
                    </p>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".md,.txt"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="text-emerald-600 border-emerald-300"
                    >
                      Choose Files
                    </Button>
                    {uploadProgress > 0 && (
                      <div className="mt-2">
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                    <CardDescription className="text-gray-300 text-sm">
                      {formData.tech_stack?.length || 0} selected
                    </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {techStackOptions.map((tech) => (
                  <Button
                    key={tech}
                      variant={formData.tech_stack?.includes(tech) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleTechStack(tech)}
                    className={
                        formData.tech_stack?.includes(tech)
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
                    <CardDescription className="text-gray-300 text-sm">
                      {completionStatus.percentage}% complete
                    </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2">
              <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Overall Progress</span>
                    <span className="text-sm font-medium text-white">{completionStatus.percentage}%</span>
              </div>
                  <Progress value={completionStatus.percentage} className="h-2" />
              </div>
                
                <div className="space-y-2">
                  {[
                    { field: 'name', label: 'Title', value: formData.name },
                    { field: 'description', label: 'Description', value: formData.description },
                    { field: 'tech_stack', label: 'Tech Stack', value: formData.tech_stack?.length },
                    { field: 'user_stories', label: 'User Stories', value: formData.user_stories?.some(s => s.trim()) },
                    { field: 'features', label: 'Features', value: formData.features?.some(f => f.trim()) }
                  ].map(({ field, label, value }) => (
                    <div key={field} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{label}</span>
                      {value ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-500" />
                )}
              </div>
                  ))}
              </div>
                
                {completionStatus.missingFields.length > 0 && (
                  <Alert className="bg-yellow-500/10 border-yellow-500/20">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-200 text-sm">
                      Missing: {completionStatus.missingFields.slice(0, 2).join(', ')}
                      {completionStatus.missingFields.length > 2 && ` and ${completionStatus.missingFields.length - 2} more`}
                    </AlertDescription>
                  </Alert>
                )}
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
                  onClick={() => addArrayItem('user_stories')}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                  <Plus className="w-4 h-4 mr-1" />
                Add Story
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
              {formData.user_stories?.map((story, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Textarea
                  value={story}
                    onChange={(e) => updateArrayField('user_stories', index, e.target.value)}
                  placeholder="As a [user type], I want [goal] so that [benefit]"
                  className="min-h-16 text-sm bg-white border-gray-300 text-black placeholder:text-gray-500"
                />
                <Button
                    onClick={() => removeArrayItem('user_stories', index)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50 mt-1"
                >
                    <X className="w-4 h-4" />
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
                  onClick={() => addArrayItem('features')}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                  <Plus className="w-4 h-4 mr-1" />
                Add Feature
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
              {formData.features?.map((feature, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Input
                  value={feature}
                    onChange={(e) => updateArrayField('features', index, e.target.value)}
                  placeholder="Enter a key feature..."
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                />
                <Button
                    onClick={() => removeArrayItem('features', index)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                    <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Choose a Template</CardTitle>
                <CardDescription>Start with a pre-built project template</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="web">Web Applications</SelectItem>
                    <SelectItem value="mobile">Mobile Apps</SelectItem>
                    <SelectItem value="api">APIs & Backend</SelectItem>
                    <SelectItem value="desktop">Desktop Apps</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Templates Grid */}
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-emerald-200"
                      onClick={() => handleApplyTemplate(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {template.description}
                        </p>
                        
                        {/* Tech Stack Preview */}
                        {Object.keys(template.tech_stack).length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {Object.keys(template.tech_stack).slice(0, 3).map((tech) => (
                              <Badge key={tech} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                            {Object.keys(template.tech_stack).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{Object.keys(template.tech_stack).length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{template.features?.length || 0} features</span>
                          <span>{template.user_stories?.length || 0} user stories</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {filteredTemplates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Layout className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No templates found matching your criteria</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 