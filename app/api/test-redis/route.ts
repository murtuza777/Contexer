import { NextRequest, NextResponse } from 'next/server'
import { RedisStateManager } from '@/lib/realtime/redis-state-manager'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Redis connection...')
    
    const redisManager = new RedisStateManager()
    
    // Test basic connectivity
    const isHealthy = await redisManager.isHealthy()
    
    if (!isHealthy) {
      return NextResponse.json(
        { error: 'Redis connection failed' },
        { status: 500 }
      )
    }

    // Test basic operations
    const testKey = 'test:connection'
    const testValue = { message: 'Hello from Contexer!', timestamp: new Date() }
    
    // Set test data
    await redisManager.setCacheData(testKey, testValue, 60) // 1 minute expiry
    
    // Get test data
    const retrievedValue = await redisManager.getCacheData(testKey)
    
    // Clean up
    await redisManager.deleteCacheData(testKey)
    
    return NextResponse.json({
      success: true,
      message: 'Redis connection successful!',
      testData: {
        stored: testValue,
        retrieved: retrievedValue,
        matches: JSON.stringify(testValue) === JSON.stringify(retrievedValue)
      },
      redisUrl: process.env.REDIS_URL ? 'Using REDIS_URL (Upstash)' : 'Using local Redis config'
    })
    
  } catch (error) {
    console.error('Redis test failed:', error)
    return NextResponse.json(
      { 
        error: 'Redis test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        redisUrl: process.env.REDIS_URL ? 'REDIS_URL configured' : 'No REDIS_URL found'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, key, value } = body
    
    const redisManager = new RedisStateManager()
    
    switch (action) {
      case 'set':
        await redisManager.setCacheData(key, value, 300) // 5 minutes
        return NextResponse.json({ success: true, message: `Key "${key}" set successfully` })
        
      case 'get':
        const data = await redisManager.getCacheData(key)
        return NextResponse.json({ success: true, key, value: data })
        
      case 'delete':
        await redisManager.deleteCacheData(key)
        return NextResponse.json({ success: true, message: `Key "${key}" deleted successfully` })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Redis operation failed:', error)
    return NextResponse.json(
      { error: 'Redis operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 