import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking Docker services status...')
    
    // Check if Docker is available
    try {
      await execAsync('docker --version')
    } catch (error) {
      return NextResponse.json({
        success: false,
        dockerConnected: false,
        error: 'Docker not available',
        details: {
          message: 'Docker CLI not found or not running',
          suggestion: 'Make sure Docker Desktop is installed and running',
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }

    // Check specific containers
    const containerNames = ['contexer-redis', 'contexer-postgres', 'contexer-redis-ui']
    const containerStatus = []

    for (const name of containerNames) {
      try {
        const { stdout } = await execAsync(`docker inspect ${name} --format="{{.State.Status}},{{.State.Running}},{{.Config.Image}}"`)
        const [status, running, image] = stdout.trim().split(',')
        
        containerStatus.push({
          name,
          status,
          running: running === 'true',
          image,
          available: true
        })
      } catch (error) {
        containerStatus.push({
          name,
          status: 'not found',
          running: false,
          image: 'unknown',
          available: false
        })
      }
    }

    // Check port availability
    const portStatus: Record<string, boolean> = {}
    const ports = [
      { name: 'redis', port: 6379 },
      { name: 'postgres', port: 5432 },
      { name: 'redis-ui', port: 8081 }
    ]

    for (const { name, port } of ports) {
      try {
        await execAsync(`netstat -an | findstr :${port}`)
        portStatus[name] = true
      } catch (error) {
        portStatus[name] = false
      }
    }

    const servicesRunning = {
      redis: containerStatus.find(c => c.name === 'contexer-redis')?.running || false,
      postgres: containerStatus.find(c => c.name === 'contexer-postgres')?.running || false,
      redisUI: containerStatus.find(c => c.name === 'contexer-redis-ui')?.running || false
    }

    const allServicesRunning = Object.values(servicesRunning).every(Boolean)
    const runningCount = containerStatus.filter(c => c.running).length

    return NextResponse.json({
      success: true,
      dockerConnected: true,
      containers: containerStatus,
      services: servicesRunning,
      ports: portStatus,
      allServicesRunning,
      summary: {
        total: containerStatus.length,
        running: runningCount,
        stopped: containerStatus.length - runningCount,
        available: containerStatus.filter(c => c.available).length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Docker health check failed:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({
      success: false,
      dockerConnected: false,
      error: 'Docker health check failed',
      details: {
        message: errorMessage,
        suggestion: 'Check if Docker Desktop is running',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, service } = await request.json()
    
    if (action === 'restart' && service) {
      const containerName = `contexer-${service}`
      
      try {
        await execAsync(`docker restart ${containerName}`)
        
        return NextResponse.json({
          success: true,
          message: `Service ${service} restarted successfully`,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: `Failed to restart ${service}`,
          details: {
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        }, { status: 500 })
      }
    }

    if (action === 'start-all') {
      try {
        await execAsync('docker-compose -f docker-compose.dev.yml up -d')
        
        return NextResponse.json({
          success: true,
          message: 'All Docker services started successfully',
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Failed to start Docker services',
          details: {
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action or service'
    }, { status: 400 })

  } catch (error) {
    console.error('Docker operation failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Docker operation failed',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
} 