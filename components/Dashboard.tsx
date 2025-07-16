"use client"

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  FileText, 
  Eye, 
  Bug, 
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

// Import feature components
import Viber from '@/components/features/Viber'
import ContextComposer from '@/components/features/ContextComposer'
import VisualObserver from '@/components/features/VisualObserver'
import ErrorFixer from '@/components/features/ErrorFixer'
import ProgressLevel from '@/components/features/ProgressLevel'
import SettingsPanel from '@/components/features/SettingsPanel'

type FeatureType = 'viber' | 'context-composer' | 'visual-observer' | 'error-fixer' | 'progress-level' | 'settings'

interface NavItem {
  id: FeatureType
  label: string
  icon: React.ReactNode
  description: string
}

const navigationItems: NavItem[] = [
  {
    id: 'viber',
    label: 'Viber',
    icon: <Bot className="w-5 h-5" />,
    description: 'AI Agent for autonomous project building'
  },
  {
    id: 'context-composer',
    label: 'Context Composer',
    icon: <FileText className="w-5 h-5" />,
    description: 'Define your project idea and requirements'
  },
  {
    id: 'visual-observer',
    label: 'Visual Observer',
    icon: <Eye className="w-5 h-5" />,
    description: 'Monitor webapp behavior and features'
  },
  {
    id: 'error-fixer',
    label: 'Error Fixer',
    icon: <Bug className="w-5 h-5" />,
    description: 'Automatic error detection and fixing'
  },
  {
    id: 'progress-level',
    label: 'Progress Level',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Track project development progress'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    description: 'User settings and editor extensions'
  }
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [activeFeature, setActiveFeature] = useState<FeatureType>('viber')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const renderFeatureComponent = () => {
    switch (activeFeature) {
      case 'viber':
        return <Viber />
      case 'context-composer':
        return <ContextComposer />
      case 'visual-observer':
        return <VisualObserver />
      case 'error-fixer':
        return <ErrorFixer />
      case 'progress-level':
        return <ProgressLevel />
      case 'settings':
        return <SettingsPanel />
      default:
        return <Viber />
    }
  }

  const activeNavItem = navigationItems.find(item => item.id === activeFeature)

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-navy-900 border-r border-navy-800 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-navy-800">
        <div className="flex items-center justify-between">
            {sidebarOpen && (
          <div>
                <h2 className="text-xl font-bold text-white">Contexer</h2>
                <p className="text-sm text-navy-300">AI Development Platform</p>
          </div>
            )}
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-navy-300 hover:text-white hover:bg-navy-800"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={activeFeature === item.id ? "default" : "ghost"}
                className={`w-full justify-start text-left ${
                  activeFeature === item.id 
                    ? 'bg-navy-700 text-white' 
                    : 'text-navy-300 hover:text-white hover:bg-navy-800'
                } ${!sidebarOpen && 'px-3'}`}
                onClick={() => setActiveFeature(item.id)}
              >
                <div className="flex items-center">
                  {item.icon}
                  {sidebarOpen && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
              </div>
              </Button>
            ))}
          </nav>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-navy-800">
          {sidebarOpen ? (
            <Card className="bg-navy-800 border-navy-700">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-navy-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.email || 'Demo User'}
                    </p>
                    <p className="text-xs text-navy-300">Developer</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="w-full mt-2 text-navy-300 hover:text-white hover:bg-navy-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full text-navy-300 hover:text-white hover:bg-navy-800"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Feature Content */}
        <div className="flex-1 p-6 overflow-auto bg-gray-50">
          {renderFeatureComponent()}
        </div>
      </div>
    </div>
  )
} 