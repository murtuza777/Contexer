"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Bug, 
  Zap, 
  CheckCircle2,
  AlertTriangle,
  X,
  Terminal,
  Code2,
  Wrench,
  Activity,
  Clock,
  FileText,
  Eye,
  Loader2
} from 'lucide-react'

interface ErrorEntry {
  id: string
  timestamp: Date
  type: 'build' | 'runtime' | 'console' | 'network' | 'syntax'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  file?: string
  line?: number
  stack?: string
  status: 'detected' | 'fixing' | 'fixed' | 'failed'
  solution?: string
  fixTime?: number
}

export default function ErrorFixer() {
  const [errors, setErrors] = useState<ErrorEntry[]>([])
  const [isAutoFixing, setIsAutoFixing] = useState(true)
  const [selectedError, setSelectedError] = useState<ErrorEntry | null>(null)
  const [fixProgress, setFixProgress] = useState(0)

  useEffect(() => {
    // Simulate error detection
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const mockError: ErrorEntry = {
          id: `error-${Date.now()}`,
          timestamp: new Date(),
          type: ['build', 'runtime', 'console', 'network', 'syntax'][Math.floor(Math.random() * 5)] as any,
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          message: [
            'TypeError: Cannot read property of undefined',
            'Failed to compile: Syntax error in component',
            'Network request failed: 404 Not Found',
            'Build error: Missing dependency',
            'React Hook error: Invalid hook call'
          ][Math.floor(Math.random() * 5)],
          file: ['App.tsx', 'Dashboard.tsx', 'api/users.ts', 'utils.ts'][Math.floor(Math.random() * 4)],
          line: Math.floor(Math.random() * 100) + 1,
          status: 'detected'
        }
        setErrors(prev => [...prev, mockError])

        // Auto-fix if enabled
        if (isAutoFixing) {
          setTimeout(() => autoFixError(mockError.id), 2000)
        }
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [isAutoFixing])

  const autoFixError = (errorId: string) => {
    setErrors(prev => prev.map(error => 
      error.id === errorId 
        ? { ...error, status: 'fixing' }
        : error
    ))

    // Simulate fixing process
    setFixProgress(0)
    const progressInterval = setInterval(() => {
      setFixProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setErrors(prevErrors => prevErrors.map(error => 
            error.id === errorId 
              ? { 
                  ...error, 
                  status: Math.random() > 0.8 ? 'failed' : 'fixed',
                  solution: 'Automatically generated fix applied',
                  fixTime: Math.floor(Math.random() * 5) + 1
                }
              : error
          ))
          return 0
        }
        return prev + 20
      })
    }, 500)
  }

  const manualFix = (errorId: string) => {
    autoFixError(errorId)
  }

  const dismissError = (errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/30'
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/30'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'detected':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'fixing':
        return <Activity className="w-4 h-4 text-blue-400 animate-spin" />
      case 'fixed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case 'failed':
        return <X className="w-4 h-4 text-red-400" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'build': return <Wrench className="w-4 h-4" />
      case 'runtime': return <Code2 className="w-4 h-4" />
      case 'console': return <Terminal className="w-4 h-4" />
      case 'network': return <Activity className="w-4 h-4" />
      case 'syntax': return <FileText className="w-4 h-4" />
      default: return <Bug className="w-4 h-4" />
    }
  }

  const errorStats = {
    total: errors.length,
    fixed: errors.filter(e => e.status === 'fixed').length,
    fixing: errors.filter(e => e.status === 'fixing').length,
    critical: errors.filter(e => e.severity === 'critical').length
  }

  return (
    <div className="h-full bg-white overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Error Fixer Status */}
      <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Bug className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Error Fixer</CardTitle>
                <CardDescription className="text-gray-600">
                  Automatic error detection and fixing system
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`${
                isAutoFixing 
                  ? 'text-green-600 border-green-300 bg-green-50 animate-pulse' 
                  : 'text-gray-600 border-gray-300 bg-gray-50'
              } transition-all duration-300`}
            >
              {isAutoFixing ? (
                <>
                  <Zap className="w-3 h-3 mr-1" />
                  Auto-Fix Active
                </>
              ) : (
                'Manual Mode'
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200">
              <div className="text-2xl font-bold text-gray-900 animate-in zoom-in duration-500">{errorStats.total}</div>
              <div className="text-xs text-gray-600">Total Errors</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-all duration-200">
              <div className="text-2xl font-bold text-green-600 animate-in zoom-in duration-500 delay-100">{errorStats.fixed}</div>
              <div className="text-xs text-gray-600">Fixed</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200">
              <div className="text-2xl font-bold text-blue-600 animate-in zoom-in duration-500 delay-200">{errorStats.fixing}</div>
              <div className="text-xs text-gray-600">In Progress</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200">
              <div className="text-2xl font-bold text-red-600 animate-in zoom-in duration-500 delay-300">{errorStats.critical}</div>
              <div className="text-xs text-gray-600">Critical</div>
            </div>
          </div>

          {fixProgress > 0 && (
            <div className="space-y-2 animate-in slide-in-from-top duration-500">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Fixing error...</span>
                <span className="text-gray-600">{fixProgress}%</span>
              </div>
              <Progress value={fixProgress} className="h-2" />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsAutoFixing(!isAutoFixing)}
              className={`${
                isAutoFixing 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                  : 'bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700'
              } text-white transition-all duration-300 hover:scale-105`}
            >
              <Zap className="w-4 h-4 mr-2" />
              {isAutoFixing ? 'Disable Auto-Fix' : 'Enable Auto-Fix'}
            </Button>
            
            <Button
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-100 transition-all duration-200"
              onClick={() => setErrors([])}
            >
              Clear All Errors
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-navy-800 border-navy-700 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Recent Errors</CardTitle>
              <Badge variant="outline" className="text-gray-300 border-navy-600 bg-navy-700">
                {errors.length} active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {errors.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Errors Detected</h3>
                <p className="text-gray-300">Your project is running smoothly!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {errors.map((error) => (
                  <div key={error.id} className="bg-navy-700 border border-navy-600 rounded-lg p-3 hover:bg-navy-600 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(error.type)}
                        <span className="text-sm font-medium text-white">{error.message}</span>
                      </div>
                      {getStatusIcon(error.status)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getSeverityColor(error.severity)}>
                          {error.severity}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {error.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="flex space-x-1">
                        {error.status === 'detected' && (
                          <Button
                            size="sm"
                            onClick={() => manualFix(error.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            Fix
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => dismissError(error.id)}
                          className="text-gray-400 border-navy-500 hover:bg-navy-500 text-xs"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                    
                    {error.file && (
                      <div className="text-xs text-gray-400 mt-2 font-mono">
                        {error.file}:{error.line}
                      </div>
                    )}
                    
                    {error.solution && (
                      <div className="mt-2 p-2 bg-green-600/20 border border-green-500/30 rounded text-xs text-green-400">
                        <div className="flex items-center space-x-1 mb-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Fixed in {error.fixTime}s</span>
                        </div>
                        <div>{error.solution}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Analytics */}
        <Card className="bg-navy-800 border-navy-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Error Analytics</CardTitle>
            <CardDescription className="text-gray-300">Patterns and insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Build Errors</span>
                <span className="text-white font-medium">
                  {errors.filter(e => e.type === 'build').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Runtime Errors</span>
                <span className="text-white font-medium">
                  {errors.filter(e => e.type === 'runtime').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Console Errors</span>
                <span className="text-white font-medium">
                  {errors.filter(e => e.type === 'console').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Network Errors</span>
                <span className="text-white font-medium">
                  {errors.filter(e => e.type === 'network').length}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-navy-600">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {errorStats.fixed > 0 ? Math.round((errorStats.fixed / errorStats.total) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-400">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
} 