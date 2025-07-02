"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { BarChart3, CheckCircle2, Clock, Target, Zap } from 'lucide-react'

interface ProgressMetric {
  category: string
  completed: number
  total: number
  features: string[]
  color: string
}

export default function ProgressLevel() {
  const [progressData] = useState<ProgressMetric[]>([
    {
      category: 'Authentication',
      completed: 8,
      total: 10,
      features: ['User registration', 'Login/logout', 'Password reset', 'Email verification'],
      color: 'bg-blue-500'
    },
    {
      category: 'Database Setup',
      completed: 6,
      total: 8,
      features: ['Schema design', 'Migrations', 'Seed data', 'Relationships'],
      color: 'bg-green-500'
    },
    {
      category: 'UI Components',
      completed: 12,
      total: 15,
      features: ['Dashboard', 'Forms', 'Navigation', 'Modals'],
      color: 'bg-purple-500'
    },
    {
      category: 'API Endpoints',
      completed: 4,
      total: 12,
      features: ['User routes', 'Auth routes', 'Data routes', 'File upload'],
      color: 'bg-orange-500'
    }
  ])

  const overallProgress = Math.round(
    (progressData.reduce((acc, item) => acc + item.completed, 0) / 
     progressData.reduce((acc, item) => acc + item.total, 0)) * 100
  )

  return (
    <div className="h-full bg-white overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Overall Progress */}
      <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-gray-900">Project Progress</CardTitle>
              <CardDescription className="text-gray-600">
                Overall development completion status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-900 mb-2 animate-in fade-in duration-1000">{overallProgress}%</div>
            <div className="text-gray-600">Complete</div>
            <Progress value={overallProgress} className="mt-4 h-3 animate-in slide-in-from-left duration-1000" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="text-2xl font-bold text-gray-900 animate-in zoom-in duration-500">
                {progressData.reduce((acc, item) => acc + item.completed, 0)}
              </div>
              <div className="text-xs text-gray-600">Features Done</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="text-2xl font-bold text-gray-900 animate-in zoom-in duration-500 delay-100">
                {progressData.reduce((acc, item) => acc + item.total, 0)}
              </div>
              <div className="text-xs text-gray-600">Total Features</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="text-2xl font-bold text-gray-900 animate-in zoom-in duration-500 delay-200">4</div>
              <div className="text-xs text-gray-600">Categories</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="text-2xl font-bold text-gray-900 animate-in zoom-in duration-500 delay-300">2</div>
              <div className="text-xs text-gray-600">Days Left</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {progressData.map((metric, index) => (
          <Card key={index} className="bg-navy-800 border-navy-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">{metric.category}</CardTitle>
                <Badge variant="outline" className="text-gray-300 border-navy-600 bg-navy-700 animate-pulse">
                  {metric.completed}/{metric.total}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Progress</span>
                <span className="text-white font-medium">
                  {Math.round((metric.completed / metric.total) * 100)}%
                </span>
              </div>
              <Progress 
                value={(metric.completed / metric.total) * 100} 
                className="h-2 animate-in slide-in-from-left duration-1000"
                style={{ animationDelay: `${index * 200}ms` }}
              />
              
              <div className="space-y-2">
                <div className="text-gray-300 text-sm">Completed Features:</div>
                {metric.features.slice(0, metric.completed).map((feature, idx) => (
                  <div key={idx} className="flex items-center text-sm text-green-400 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {feature}
                  </div>
                ))}
                {metric.features.slice(metric.completed).map((feature, idx) => (
                  <div key={idx} className="flex items-center text-sm text-gray-500 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${(idx + metric.completed) * 100}ms` }}>
                    <Clock className="w-4 h-4 mr-2" />
                    {feature}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </div>
  )
} 