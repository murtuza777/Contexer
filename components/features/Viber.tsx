"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { 
  Bot, 
  Play, 
  Pause, 
  Square, 
  Activity, 
  MessageSquare,
  Check,
  X,
  Loader2,
  Zap,
  Eye,
  Code2,
  Bug,
  AlertCircle,
  CheckCircle2,
  Brain,
  Sparkles,
  Monitor,
  Send,
  Cpu,
  Settings
} from 'lucide-react'

interface PromptSession {
  id: string
  prompt: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  response?: string
  timestamp: Date
  observations?: string[]
  errorsFixed?: number
}

interface AgentStatus {
  isActive: boolean
  currentTask: string
  sessionsCompleted: number
  totalSessions: number
  errorsFixed: number
  progress: number
}

interface FloatingOrb {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
  opacity: number
}

interface RobotPart {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
}

export default function Viber() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    isActive: false,
    currentTask: 'Waiting for instructions',
    sessionsCompleted: 0,
    totalSessions: 0,
    errorsFixed: 0,
    progress: 0
  })
  
  const [promptSessions, setPromptSessions] = useState<PromptSession[]>([])
  const [manualPrompt, setManualPrompt] = useState('')
  const [isObserving, setIsObserving] = useState(false)
  const [floatingOrbs, setFloatingOrbs] = useState<FloatingOrb[]>([])
  const [robotParts, setRobotParts] = useState<RobotPart[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new sessions are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [promptSessions])

  // Generate floating orbs for 3D background animation
  useEffect(() => {
    const newOrbs = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 15,
      opacity: Math.random() * 0.3 + 0.1
    }))
    setFloatingOrbs(newOrbs)

    // Generate robot parts for running animation
    const newRobotParts = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 30,
      y: 50 + Math.random() * 20,
      rotation: Math.random() * 360,
      scale: Math.random() * 0.5 + 0.5
    }))
    setRobotParts(newRobotParts)
  }, [])

  const startAutonomousMode = async () => {
    setAgentStatus(prev => ({
      ...prev,
      isActive: true,
      currentTask: 'Initializing visual sensors...',
      progress: 0
    }))
    setIsObserving(true)

    // Simulate autonomous session with robot animation
    setTimeout(() => {
      const newSession: PromptSession = {
        id: `session-${Date.now()}`,
        prompt: 'Initialize project based on context composer requirements',
        status: 'processing',
        timestamp: new Date(),
        observations: ['Analyzing context requirements', 'Checking current project state']
      }
      setPromptSessions(prev => [...prev, newSession])
      
      setAgentStatus(prev => ({
        ...prev,
        currentTask: 'Generating project architecture...',
        progress: 25
      }))
    }, 2000)
  }

  const pauseAutonomousMode = () => {
    setAgentStatus(prev => ({
      ...prev,
      isActive: false,
      currentTask: 'Paused - waiting for resume',
      progress: 0
    }))
    setIsObserving(false)
  }

  const stopAutonomousMode = () => {
    setAgentStatus(prev => ({
      ...prev,
      isActive: false,
      currentTask: 'Stopped - ready for new session',
      progress: 0
    }))
    setIsObserving(false)
    setPromptSessions([])
  }

  const sendManualPrompt = async () => {
    if (!manualPrompt.trim()) return

    setIsTyping(true)
    const newSession: PromptSession = {
      id: `manual-${Date.now()}`,
      prompt: manualPrompt,
      status: 'processing',
      timestamp: new Date()
    }

    setPromptSessions(prev => [...prev, newSession])
    setManualPrompt('')

    // Simulate processing with robot running animation
    setTimeout(() => {
      setIsTyping(false)
      setPromptSessions(prev => 
        prev.map(session => 
          session.id === newSession.id 
            ? { 
                ...session, 
                status: 'completed',
                response: 'Prompt processed successfully. Generated code changes and applied fixes.',
                errorsFixed: Math.floor(Math.random() * 3)
              }
            : session
        )
      )
      
      setAgentStatus(prev => ({
        ...prev,
        sessionsCompleted: prev.sessionsCompleted + 1,
        errorsFixed: prev.errorsFixed + Math.floor(Math.random() * 3)
      }))
    }, 3000)
  }

  const getStatusIcon = (status: PromptSession['status']) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-amber-500" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case 'error':
        return <X className="w-4 h-4 text-red-500" />
    }
  }

  return (
    <div className="h-full flex relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* 3D Floating Orbs Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingOrbs.map((orb) => (
          <div
            key={orb.id}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              background: `radial-gradient(circle, rgba(59, 130, 246, ${orb.opacity}) 0%, rgba(147, 197, 253, ${orb.opacity * 0.5}) 50%, transparent 100%)`,
              animationDelay: `${orb.delay}s`,
              animationDuration: `${orb.duration}s`,
              transform: 'translateZ(0)',
              filter: 'blur(0.5px)'
            }}
          />
        ))}
        
        {/* Circular 3D Gradient Rings */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-96 h-96 rounded-full border border-blue-200/30 animate-spin" style={{ animationDuration: '20s' }} />
          <div className="absolute inset-8 rounded-full border border-indigo-200/20 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
          <div className="absolute inset-16 rounded-full border border-cyan-200/25 animate-spin" style={{ animationDuration: '25s' }} />
        </div>

        {/* Robot Running Animation (when processing) */}
        {(agentStatus.isActive || isTyping) && (
          <div className="absolute bottom-20 left-10">
            <div className="relative w-16 h-16 animate-bounce">
              {robotParts.map((part) => (
                <div
                  key={part.id}
                  className="absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse"
                  style={{
                    left: `${part.x}%`,
                    top: `${part.y}%`,
                    transform: `rotate(${part.rotation}deg) scale(${part.scale})`,
                    animationDelay: `${part.id * 0.1}s`
                  }}
                />
              ))}
              <Bot className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="text-xs text-blue-600 text-center mt-2 animate-pulse">
              {isTyping ? 'Processing...' : 'Building...'}
            </div>
          </div>
        )}
      </div>

      {/* Left Panel - Enhanced Agent Status */}
      <div className="w-80 border-r border-slate-200/80 bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 p-6 space-y-6 relative z-10 shadow-2xl">
        {/* Agent Status Header with 3D Effect */}
        <Card className="bg-gradient-to-br from-slate-800/90 to-blue-800/90 border-blue-500/30 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          {/* Animated Border Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-indigo-500/20 animate-pulse rounded-lg" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent rounded-lg" />
          <div className="absolute inset-[1px] bg-gradient-to-br from-slate-800/95 to-blue-800/95 rounded-lg" />
          
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-600 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg">
                    <Bot className="w-7 h-7 text-white relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent animate-pulse rounded-2xl" />
                    {agentStatus.isActive && (
                      <div className="absolute inset-0 bg-white/20 animate-ping rounded-2xl" />
                    )}
                  </div>
                  {agentStatus.isActive && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-lg border-2 border-white" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-white text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Viber AI
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${agentStatus.isActive ? 'bg-emerald-400 shadow-emerald-400/50 shadow-lg animate-pulse' : 'bg-slate-500'}`} />
                    <span className="text-sm text-slate-300 font-medium">
                      {agentStatus.isActive ? 'Active' : 'Standby'}
                    </span>
                  </div>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`${
                  agentStatus.isActive 
                    ? 'text-emerald-400 border-emerald-500/50 bg-emerald-900/30 shadow-emerald-500/20 shadow-lg animate-pulse' 
                    : 'text-slate-400 border-slate-600/50 bg-slate-800/30'
                } transition-all duration-500 font-semibold px-3 py-1`}
              >
                {agentStatus.isActive ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Brain className="w-5 h-5 text-cyan-400" />
                <span className="text-sm text-slate-300 font-medium">Current Task:</span>
              </div>
                             <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                 <div className="font-medium text-sm text-white flex items-center min-h-[2.5rem]">
                   <span>{agentStatus.currentTask}</span>
                   {agentStatus.isActive && (
                     <div className="ml-3 flex space-x-1">
                       <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                       <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                       <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                     </div>
                   )}
                 </div>
               </div>
            </div>
            
            {agentStatus.isActive && agentStatus.progress > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-300">
                  <span className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-blue-400" />
                    Progress
                  </span>
                  <span className="font-bold text-cyan-400">{Math.round(agentStatus.progress)}%</span>
                </div>
                <div className="relative">
                  <Progress value={agentStatus.progress} className="h-3 bg-slate-700" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full animate-pulse" />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-slate-800/80 to-blue-800/40 rounded-xl border border-slate-700/50 shadow-lg">
                <div className="text-2xl font-bold text-white mb-1">{agentStatus.sessionsCompleted}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Sessions</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-slate-800/80 to-emerald-800/40 rounded-xl border border-slate-700/50 shadow-lg">
                <div className="text-2xl font-bold text-emerald-400 mb-1">{agentStatus.errorsFixed}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Fixes</div>
              </div>
            </div>

            {!agentStatus.isActive ? (
              <Button 
                onClick={startAutonomousMode}
                className="bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-700 hover:via-cyan-700 hover:to-indigo-700 text-white w-full relative overflow-hidden group transition-all duration-500 shadow-lg hover:shadow-xl py-3 font-semibold"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Play className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">Start Autonomous Mode</span>
              </Button>
            ) : (
              <div className="flex space-x-3">
                <Button 
                  onClick={pauseAutonomousMode}
                  variant="outline"
                  className="text-amber-400 border-amber-500/50 hover:bg-amber-900/20 flex-1 transition-all duration-300 font-medium"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button 
                  onClick={stopAutonomousMode}
                  variant="outline"
                  className="text-red-400 border-red-500/50 hover:bg-red-900/20 flex-1 transition-all duration-300 font-medium"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-gradient-to-br from-slate-800/60 to-blue-800/30 border-slate-600/30 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-sm text-slate-300 font-medium">Components Built</span>
                    <div className="text-xs text-slate-500">Active development</div>
                  </div>
                </div>
                <span className="text-xl font-bold text-white">24</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-slate-800/60 to-emerald-800/30 border-slate-600/30 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-sm text-slate-300 font-medium">Tests Passing</span>
                    <div className="text-xs text-slate-500">Quality assurance</div>
                  </div>
                </div>
                <span className="text-xl font-bold text-emerald-400">98%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel - Enhanced Chat Interface */}
      <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-sm relative z-10">
        {/* Chat Messages Area with 3D Background */}
        <div className="flex-1 overflow-y-auto relative" ref={scrollRef}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-cyan-50" />
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, rgba(14, 165, 233, 0.1) 0%, transparent 50%)`
            }} />
          </div>

          <div className="relative z-10 p-6 space-y-6">
            {promptSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-8 min-h-96">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 via-cyan-100 to-indigo-100 rounded-full flex items-center justify-center shadow-2xl">
                    <Bot className="w-12 h-12 text-blue-600" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full animate-pulse" />
                  <div className="absolute -inset-4 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full animate-ping" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-800 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Ready to build amazing things!
                  </h3>
                  <p className="text-slate-600 max-w-md text-lg leading-relaxed">
                    I'm your autonomous AI assistant. Send me a message to start building your project!
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    variant="outline" 
                    size="lg"
                    onClick={() => setManualPrompt("Add user authentication to my project")}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Add authentication
                  </Button>
                  <Button
                    variant="outline" 
                    size="lg"
                    onClick={() => setManualPrompt("Create a dashboard component")}
                    className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Create dashboard
                  </Button>
                  <Button
                    variant="outline" 
                    size="lg"
                    onClick={() => setManualPrompt("Fix styling issues")}
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                  >
                    <Code2 className="w-4 h-4 mr-2" />
                    Fix styling
                  </Button>
                </div>
              </div>
            ) : (
              promptSessions.map((session) => (
                <div key={session.id} className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-lg bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white rounded-2xl rounded-br-md px-6 py-4 shadow-xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                      <p className="text-sm leading-relaxed relative z-10">{session.prompt}</p>
                      <p className="text-xs text-blue-200 mt-2 relative z-10">
                        {session.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="flex space-x-4 max-w-4xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 relative shadow-lg">
                        <Bot className="w-5 h-5 text-white" />
                        <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" />
                      </div>
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl rounded-bl-md px-6 py-4 shadow-xl border border-slate-200/50 transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent" />
                        {session.status === 'processing' ? (
                          <div className="flex items-center space-x-3 relative z-10">
                            <div className="w-6 h-6 relative">
                              <div className="absolute inset-0 border-2 border-blue-200 rounded-full"></div>
                              <div className="absolute inset-0 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <span className="text-sm text-slate-700 font-medium">Analyzing and generating solution...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-slate-800 leading-relaxed relative z-10">
                              {session.response || 'Processing your request...'}
                            </p>
                            {session.observations && session.observations.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-slate-200/70 relative z-10">
                                <div className="flex items-center text-xs text-slate-600 mb-2 font-medium">
                                  <Activity className="w-3 h-3 mr-2" />
                                  Observations:
                                </div>
                                {session.observations.map((obs, index) => (
                                  <div key={index} className="text-xs text-slate-600 ml-5 mb-1">
                                    • {obs}
                                  </div>
                                ))}
                              </div>
                            )}
                            {session.errorsFixed && session.errorsFixed > 0 && (
                              <div className="flex items-center text-emerald-600 text-xs mt-3 relative z-10 font-medium">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Fixed {session.errorsFixed} error{session.errorsFixed > 1 ? 's' : ''}
                              </div>
                            )}
                            <p className="text-xs text-slate-500 mt-3 relative z-10">
                              {session.timestamp.toLocaleTimeString()}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Enhanced Chat Input */}
        <div className="border-t border-slate-200/50 p-6 bg-gradient-to-r from-slate-50/90 via-blue-50/30 to-cyan-50/30 backdrop-blur-sm relative">
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <Textarea
                value={manualPrompt}
                onChange={(e) => setManualPrompt(e.target.value)}
                placeholder="Describe what you'd like me to build or fix..."
                className="w-full pr-16 resize-none bg-black border-0 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 rounded-2xl text-sm leading-relaxed py-4 px-5"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (manualPrompt.trim()) {
                      sendManualPrompt()
                    }
                  }
                }}
              />
              <Button
                size="sm"
                onClick={sendManualPrompt}
                disabled={!manualPrompt.trim()}
                className="absolute right-3 bottom-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100 font-medium"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-slate-500 flex items-center font-medium">
                <Sparkles className="w-3 h-3 mr-1" />
                Press Enter to send, Shift + Enter for new line
              </p>
              {isTyping && (
                <div className="flex items-center text-xs text-blue-600 font-medium">
                  <div className="flex space-x-1 mr-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Viber is thinking...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 