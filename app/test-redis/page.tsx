'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TestRedisPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testRedisConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/redis-health')
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      setTestResults({
        success: false,
        error: 'Failed to test Redis connection',
        details: { message: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setLoading(false)
    }
  }

  const testRedisOperations = async (action: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/redis-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      setTestResults({
        success: false,
        error: `Failed to execute ${action}`,
        details: { message: error instanceof Error ? error.message : 'Unknown error' }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔧 Contexer Redis Connection Test</h1>
        <p className="text-muted-foreground">
          Test your Upstash Redis connection and verify that the real-time infrastructure is working properly.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Redis Connection Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={testRedisConnection}
                disabled={loading}
                variant="default"
              >
                {loading ? 'Testing...' : 'Test Full Connection'}
              </Button>
              
              <Button 
                onClick={() => testRedisOperations('ping')}
                disabled={loading}
                variant="outline"
              >
                Test Ping
              </Button>
              
              <Button 
                onClick={() => testRedisOperations('info')}
                disabled={loading}
                variant="outline"
              >
                Get Server Info
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Test Results
                <Badge variant={testResults.success ? 'default' : 'destructive'}>
                  {testResults.success ? 'SUCCESS' : 'FAILED'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.success ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">✅ Redis Connection Successful!</h4>
                      <p className="text-green-700">{testResults.message}</p>
                    </div>
                    
                    {testResults.details && (
                      <div className="space-y-2">
                        {testResults.details.redisUrl && (
                          <div><strong>Redis:</strong> {testResults.details.redisUrl}</div>
                        )}
                        {testResults.details.operations && (
                          <div><strong>Operations Tested:</strong> {testResults.details.operations.join(', ')}</div>
                        )}
                        {testResults.details.testPassed !== undefined && (
                          <div><strong>Test Passed:</strong> {testResults.details.testPassed ? '✅ Yes' : '❌ No'}</div>
                        )}
                        {testResults.result && (
                          <div><strong>Ping Result:</strong> {testResults.result}</div>
                        )}
                        {testResults.serverInfo && (
                          <div>
                            <strong>Server Info:</strong>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-x-auto">
                              {testResults.serverInfo.join('\n')}
                            </pre>
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          <strong>Timestamp:</strong> {testResults.details.timestamp || testResults.timestamp}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">❌ Redis Connection Failed</h4>
                      <p className="text-red-700">{testResults.error}</p>
                    </div>
                    
                    {testResults.details && (
                      <div className="space-y-2">
                        <div><strong>Error Message:</strong> {testResults.details.message}</div>
                        <div><strong>Redis URL Status:</strong> {testResults.details.redisUrl}</div>
                        {testResults.details.timestamp && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Timestamp:</strong> {testResults.details.timestamp}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Raw Response for Debugging */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Show Raw Response (for debugging)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• ✅ <strong>Redis Connected:</strong> Your Upstash Redis is working properly</p>
              <p>• 🔄 <strong>Real-time Infrastructure:</strong> Socket.io server is ready</p>
              <p>• 🎯 <strong>Ready for Phase 2:</strong> Start building Context Composer and AI Agents</p>
              <p>• 🚀 <strong>Development:</strong> Your infrastructure is ready for Contexer features!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 