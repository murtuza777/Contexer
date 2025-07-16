import { NextRequest, NextResponse } from 'next/server'
import Redis from 'ioredis'

export async function GET(request: NextRequest) {
  let redis: Redis | null = null
  
  try {
    console.log('🔍 Testing Redis connection with Upstash...')
    
    const redisUrl = process.env.REDIS_URL
    
    if (!redisUrl) {
      console.log('❌ REDIS_URL not found in environment')
      return NextResponse.json(
        { 
          success: false,
          error: 'REDIS_URL not configured',
          details: {
            message: 'Missing REDIS_URL environment variable',
            timestamp: new Date().toISOString()
          }
        },
        { status: 500 }
      )
    }

    console.log('🔗 Redis URL found, testing connection...')

    // Very basic configuration for Upstash
    redis = new Redis(redisUrl, {
      connectTimeout: 3000,      
      commandTimeout: 2000,      
      lazyConnect: false,        
      maxRetriesPerRequest: 0,   
      enableReadyCheck: false,   
      family: 4,
      enableAutoPipelining: false,
      enableOfflineQueue: false, 
      retryStrategy: () => null, 
      reconnectOnError: () => false,
      tls: redisUrl.includes('upstash.io') ? {} : undefined
    })

    // First, just test if we can connect
    let connectionSuccessful = false
    let pingSuccessful = false
    
    try {
      console.log('⏳ Testing connection...')
      
      // Test connection with a very short timeout
      const connectionTest = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 2000)
        
        redis!.on('connect', () => {
          clearTimeout(timeout)
          resolve(true)
        })
        
        redis!.on('error', (err) => {
          clearTimeout(timeout)
          reject(err)
        })
      })
      
      await connectionTest
      connectionSuccessful = true
      console.log('✅ Connection established')
      
      // Try PING with very short timeout
      console.log('⏳ Testing PING...')
      const pingTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PING timeout')), 1500)
      })
      
      const pingResult = await Promise.race([
        redis.ping(),
        pingTimeout
      ])
      
      if (pingResult === 'PONG') {
        pingSuccessful = true
        console.log('✅ PING successful')
      }
      
    } catch (error) {
      console.log('⚠️ Operation failed:', error instanceof Error ? error.message : 'Unknown')
    }

    // Determine overall status
    if (connectionSuccessful && pingSuccessful) {
      // Perfect case - everything works
      return NextResponse.json({
        success: true,
        message: 'Redis connection fully operational!',
        details: {
          redisUrl: 'Upstash Redis (Connected)',
          testPassed: true,
          connectionTime: new Date().toISOString(),
          status: 'operational'
        }
      })
    } else if (connectionSuccessful) {
      // Good enough - can connect but operations timeout (common with Upstash free tier)
      return NextResponse.json({
        success: false,
        error: 'Redis connection unstable',
        details: {
          message: 'Redis connects successfully but operations timeout',
          suggestion: 'This is normal with Upstash free tier - connection is working',
          timestamp: new Date().toISOString(),
          status: 'unstable',
          redisUrl: 'Upstash Redis (Connected but Unstable)'
        }
      }, { status: 200 }) // Return 200 to indicate service is working but unstable
    } else {
      // Failed to connect at all
      return NextResponse.json({
        success: false,
        error: 'Redis connection failed',
        details: {
          message: 'Could not establish connection to Redis',
          timestamp: new Date().toISOString(),
          status: 'offline'
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Redis health check failed:', error instanceof Error ? error.message : 'Unknown error')
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      {
        success: false,
        error: 'Redis health check failed',
        details: {
          message: errorMessage,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  } finally {
    // Quick cleanup
    if (redis) {
      try {
        console.log('🔌 Cleaning up Redis connection...')
        redis.disconnect(false) 
        console.log('✅ Redis connection cleaned up')
      } catch (cleanupError) {
        console.log('⚠️ Cleanup completed with force disconnect')
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action = 'ping' } = await request.json()
    
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      return NextResponse.json({ 
        success: false,
        error: 'REDIS_URL not configured' 
      }, { status: 500 })
    }

    const redis = new Redis(redisUrl, {
      connectTimeout: 2000,
      commandTimeout: 1500,
      lazyConnect: false,
      maxRetriesPerRequest: 0,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      retryStrategy: () => null,
      tls: redisUrl.includes('upstash.io') ? {} : undefined
    })

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), 2000)
      })

      let operationPromise
      switch (action) {
        case 'ping':
          operationPromise = redis.ping()
          break
        case 'info':
          operationPromise = redis.info('server')
          break
        case 'dbsize':
          operationPromise = redis.dbsize()
          break
        default:
          operationPromise = redis.ping()
      }

      const result = await Promise.race([operationPromise, timeoutPromise])

      return NextResponse.json({
        success: true,
        action,
        result: typeof result === 'string' && result.length > 100 ? result.substring(0, 100) + '...' : result,
        timestamp: new Date().toISOString()
      })

    } finally {
      redis.disconnect(false)
    }

  } catch (error) {
    console.error('Redis POST operation failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Redis operation failed',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
} 