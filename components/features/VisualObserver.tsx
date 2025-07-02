"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Eye, 
  Monitor, 
  Activity, 
  AlertCircle,
  CheckCircle2,
  Terminal,
  Globe,
  Code2,
  Play,
  Pause,
  RefreshCw,
  Brain
} from 'lucide-react'

interface Observation {
  id: string
  timestamp: Date
  type: 'ui' | 'performance' | 'error' | 'network' | 'console'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  details: any
  screenshot?: string
}

export default function VisualObserver() {
  const [isRecording, setIsRecording] = useState(false)
  const [observations, setObservations] = useState<Observation[]>([])
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null)
  const observationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (observationRef.current) {
      observationRef.current.scrollTop = observationRef.current.scrollHeight
    }
  }, [observations])

  const startObservation = () => {
    setIsRecording(true)
    // Simulate observations
    const interval = setInterval(() => {
      const mockObservation: Observation = {
        id: `obs-${Date.now()}`,
        timestamp: new Date(),
        type: ['ui', 'performance', 'error', 'network', 'console'][Math.floor(Math.random() * 5)] as any,
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        description: [
          'Button click detected on navigation',
          'Page load time: 1.2s',
          'Console error: TypeError in component',
          'API request to /api/users successful',
          'Form validation triggered'
        ][Math.floor(Math.random() * 5)],
        details: { source: 'webapp', line: Math.floor(Math.random() * 100) }
      }
      setObservations(prev => [...prev, mockObservation])
    }, 3000)

    return () => clearInterval(interval)
  }

  const stopObservation = () => {
    setIsRecording(false)
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ui': return <Monitor className="w-4 h-4" />
      case 'performance': return <Activity className="w-4 h-4" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      case 'network': return <Globe className="w-4 h-4" />
      case 'console': return <Terminal className="w-4 h-4" />
      default: return <Eye className="w-4 h-4" />
    }
  }

  return (
    <div className="h-full bg-white overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Website Preview */}
      <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Live Website Preview</CardTitle>
                <CardDescription className="text-gray-600">Monitoring localhost:3000</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                variant="outline" 
                className={`${
                  isRecording 
                    ? 'text-green-600 border-green-300 bg-green-50 animate-pulse' 
                    : 'text-gray-600 border-gray-300 bg-gray-50'
                } transition-all duration-300`}
              >
                {isRecording ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                    Recording
                  </>
                ) : (
                  'Monitoring Paused'
                )}
              </Badge>
              <Button
                onClick={() => setIsRecording(!isRecording)}
                size="sm"
                className={`${
                  isRecording 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                } text-white transition-all duration-300 hover:scale-105 shadow-lg`}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Browser Interface */}
          <div className="bg-gray-100 border-b border-gray-200 p-3">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 bg-white border border-gray-300 rounded px-3 py-1 text-sm text-gray-700">
                localhost:3000
              </div>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-200">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Website Content Area */}
          <div className="bg-white h-96 p-6 relative overflow-hidden">
            <div className="h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Monitor className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your App Preview</h3>
                <p className="text-gray-600">Live preview of your running application</p>
              </div>
            </div>
            
            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                LIVE
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Log */}
        <Card className="bg-navy-800 border-navy-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white">Live Observations</CardTitle>
            <CardDescription className="text-gray-300">
              Real-time monitoring logs and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96" ref={observationRef}>
              <div className="space-y-3">
                {observations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No observations yet. Start monitoring to see webapp behavior.
                  </div>
                ) : (
                  observations.map((observation) => (
                    <Card 
                      key={observation.id} 
                      className="bg-navy-700 border-navy-600 cursor-pointer hover:bg-navy-600 transition-colors"
                      onClick={() => setSelectedObservation(observation)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(observation.type)}
                            <span className="text-xs text-gray-500">
                              {observation.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={getSeverityColor(observation.severity)}
                          >
                            {observation.severity}
                          </Badge>
                        </div>
                        <div className="text-white text-sm">{observation.description}</div>
                        <div className="text-xs text-gray-400 mt-1 capitalize">
                          {observation.type} event
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Observation Summary */}
        <Card className="bg-navy-800 border-navy-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white">Observation Details</CardTitle>
            <CardDescription className="text-gray-300">
              Detailed information about the selected event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {getTypeIcon(selectedObservation?.type || '')}
                <div>
                  <div className="text-navy-900 font-medium capitalize">
                    {selectedObservation?.type} Event
                  </div>
                  <div className="text-gray-600 text-sm">
                    {selectedObservation?.timestamp.toLocaleString()}
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={getSeverityColor(selectedObservation?.severity || 'low')}
                >
                  {selectedObservation?.severity}
                </Badge>
              </div>

              <div>
                <div className="text-navy-900 text-sm mb-2 font-medium">Description:</div>
                <div className="text-gray-700 bg-gray-50 p-3 rounded-lg border">
                  {selectedObservation?.description}
                </div>
              </div>

              {selectedObservation?.details && (
                <div>
                  <div className="text-navy-900 text-sm mb-2 font-medium">Technical Details:</div>
                  <div className="text-gray-600 bg-gray-50 p-3 rounded-lg text-xs font-mono border">
                    <pre>{JSON.stringify(selectedObservation.details, null, 2)}</pre>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <Button 
                  className="bg-navy-600 hover:bg-navy-700 text-white w-full"
                >
                  <Code2 className="w-4 h-4 mr-2" />
                  Send to Viber for Auto-Fix
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
} 