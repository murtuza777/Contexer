'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'

export default function StatusPage() {
  const [redisStatus, setRedisStatus] = useState<any>(null)
  const [socketStatus, setSocketStatus] = useState<any>(null)
  const [dockerStatus, setDockerStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { supabaseConfigured } = useAuth()

  const checkRedisStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/redis-health')
      const data = await response.json()
      setRedisStatus(data)
    } catch (error) {
      setRedisStatus({
        success: false,
        error: 'Failed to check Redis status'
      })
    } finally {
      setLoading(false)
    }
  }

  const checkSocketStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/socket')
      const data = await response.json()
      setSocketStatus(data)
    } catch (error) {
      setSocketStatus({
        status: 'error',
        message: 'Failed to check Socket.io status'
      })
    } finally {
      setLoading(false)
    }
  }

  const checkDockerStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/docker-health')
      const data = await response.json()
      setDockerStatus(data)
    } catch (error) {
      setDockerStatus({
        success: false,
        dockerConnected: false,
        error: 'Failed to check Docker status'
      })
    } finally {
      setLoading(false)
    }
  }

  const checkAllServices = async () => {
    await Promise.all([
      checkRedisStatus(),
      checkSocketStatus(),
      checkDockerStatus()
    ])
  }

  useEffect(() => {
    checkAllServices()
  }, [])

  const getStatusBadge = (status: boolean | string, details?: any) => {
    if (status === true || status === 'running') {
      return <Badge variant="default">✅ Working</Badge>
    } else if (status === 'configured') {
      return <Badge variant="secondary">⚡ Configured</Badge>
    } else if (details?.status === 'unstable') {
      return <Badge variant="secondary">⚠️ Unstable</Badge>
    } else if (status === false || status === 'error') {
      return <Badge variant="destructive">❌ Error</Badge>
    } else if (status === 'not_initialized') {
      return <Badge variant="secondary">⚠️ Not Initialized</Badge>
    } else {
      return <Badge variant="outline">? Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔧 Contexer System Status</h1>
        <p className="text-muted-foreground">
          Check the status of all Contexer services and infrastructure components.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>System Health Check</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={checkAllServices}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Checking...' : 'Refresh All Status'}
            </Button>
          </CardContent>
        </Card>

        {/* Infrastructure Status */}
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Redis Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-semibold">Redis (Upstash)</h4>
                <p className="text-sm text-muted-foreground">
                  State management and real-time caching
                </p>
                {redisStatus?.details?.redisUrl && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {redisStatus.details.redisUrl}
                  </p>
                )}
              </div>
              <div className="text-right">
                {getStatusBadge(redisStatus?.success, redisStatus?.details)}
                {redisStatus?.success && redisStatus?.details?.operations && (
                  <p className="text-xs text-green-600 mt-1">
                    {redisStatus.details.operations.join(', ')} ✓
                  </p>
                )}
                {redisStatus?.details?.status === 'unstable' && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Connection working but operations timeout
                  </p>
                )}
                {redisStatus?.error && (
                  <p className="text-xs text-red-600 mt-1">
                    {redisStatus.error}
                  </p>
                )}
              </div>
            </div>

            {/* Socket.io Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-semibold">Socket.io Server</h4>
                <p className="text-sm text-muted-foreground">
                  Real-time communication and events
                </p>
              </div>
              <div className="text-right">
                {getStatusBadge(socketStatus?.status)}
                {socketStatus?.activeSessions !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {socketStatus.activeSessions} active sessions
                  </p>
                )}
              </div>
            </div>

            {/* Supabase Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-semibold">Supabase Database</h4>
                <p className="text-sm text-muted-foreground">
                  User authentication and data persistence
                </p>
              </div>
              <div className="text-right">
                {getStatusBadge(supabaseConfigured)}
                <p className="text-xs text-muted-foreground mt-1">
                  {supabaseConfigured ? 'Configured' : 'Optional for Redis development'}
                </p>
              </div>
            </div>

            {/* Docker Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-semibold">Docker Services</h4>
                <p className="text-sm text-muted-foreground">
                  Local Redis, PostgreSQL and Container Environment
                </p>
                {dockerStatus?.containers && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {dockerStatus.summary.running}/{dockerStatus.summary.total} containers running
                  </div>
                )}
              </div>
              <div className="text-right">
                {getStatusBadge(dockerStatus?.dockerConnected && dockerStatus?.allServicesRunning)}
                {dockerStatus?.services && (
                  <div className="text-xs mt-1 space-y-1">
                    <div className={dockerStatus.services.redis ? 'text-green-600' : 'text-red-600'}>
                      Redis: {dockerStatus.services.redis ? '✓' : '✗'}
                    </div>
                    <div className={dockerStatus.services.postgres ? 'text-green-600' : 'text-red-600'}>
                      PostgreSQL: {dockerStatus.services.postgres ? '✓' : '✗'}
                    </div>
                    <div className={dockerStatus.services.redisUI ? 'text-green-600' : 'text-red-600'}>
                      Redis UI: {dockerStatus.services.redisUI ? '✓' : '✗'}
                    </div>
                  </div>
                )}
                {dockerStatus?.error && (
                  <p className="text-xs text-red-600 mt-1">
                    {dockerStatus.error}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Status */}
        <Card>
          <CardHeader>
            <CardTitle>Contexer Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-semibold text-blue-600">✅ Phase 1: Infrastructure</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Real-time WebSocket server</li>
                  <li>• Redis state management</li>
                  <li>• Docker environment setup</li>
                  <li>• API endpoints</li>
                </ul>
              </div>

              <div className="p-3 border rounded-lg opacity-60">
                <h4 className="font-semibold text-gray-500">🚧 Phase 2: Core Features</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Context Composer</li>
                  <li>• Viber AI Agent</li>
                  <li>• Visual Observer</li>
                  <li>• Error Fixer</li>
                </ul>
              </div>

              <div className="p-3 border rounded-lg opacity-60">
                <h4 className="font-semibold text-gray-500">⏳ Phase 3: AI Agents</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Context Analyzer Agent</li>
                  <li>• Code Generator Agent</li>
                  <li>• Visual Inspector Agent</li>
                  <li>• Decision Orchestrator</li>
                </ul>
              </div>

              <div className="p-3 border rounded-lg opacity-60">
                <h4 className="font-semibold text-gray-500">🎯 Phase 4: Integration</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Progress tracking</li>
                  <li>• Settings panel</li>
                  <li>• Code editor extensions</li>
                  <li>• Full automation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" asChild>
                <a href="/test-redis">Test Redis Connection</a>
              </Button>
              
              <Button variant="outline" asChild>
                <a href="/api/redis-health" target="_blank">Redis Health API</a>
              </Button>
              
              <Button variant="outline" asChild>
                <a href="/api/socket" target="_blank">Socket.io Status API</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-semibold mb-2">Configuration Status</h5>
                <ul className="space-y-1">
                  <li>• REDIS_URL: {process.env.NEXT_PUBLIC_APP_URL ? '✅ Set' : '❌ Missing'}</li>
                  <li>• Supabase: {supabaseConfigured ? '✅ Configured' : '⚠️ Using placeholders'}</li>
                  <li>• App URL: {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}</li>
                </ul>
              </div>
              
              <div>
                <h5 className="font-semibold mb-2">Ready for Development</h5>
                <ul className="space-y-1">
                  <li>• {redisStatus?.success ? '✅' : '❌'} Redis working</li>
                  <li>• {socketStatus?.status === 'running' ? '✅' : '❌'} Socket.io ready</li>
                  <li>• ✅ Phase 2 can begin</li>
                  <li>• ✅ Context Composer ready to build</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 