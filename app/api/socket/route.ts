import { NextRequest, NextResponse } from 'next/server'
import { initializeSocket, getSocketServer } from '@/lib/realtime/socket-init'
import { Server } from 'http'

export async function GET(request: NextRequest) {
  try {
    // For Next.js App Router, we need to handle Socket.io differently
    // This route will be used to check if Socket.io is initialized
    const socketServer = getSocketServer()
    
    if (socketServer) {
      return NextResponse.json({ 
        status: 'running',
        activeSessions: socketServer.getActiveSessionsCount(),
        message: 'Socket.io server is running'
      })
    } else {
      // Since Socket.io is not initialized automatically in Next.js app router,
      // we'll show it as configured but not actively running
      return NextResponse.json({ 
        status: 'configured',
        activeSessions: 0,
        message: 'Socket.io server configured (will initialize on first connection)'
      })
    }
  } catch (error) {
    console.error('Error checking Socket.io status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Socket.io server if not already done
    // Note: In production, this should be handled during server startup
    const socketServer = getSocketServer()
    
    if (!socketServer) {
      return NextResponse.json(
        { error: 'Socket.io server needs to be initialized during server startup' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      status: 'initialized',
      message: 'Socket.io server is ready'
    })
  } catch (error) {
    console.error('Error initializing Socket.io:', error)
    return NextResponse.json(
      { error: 'Failed to initialize Socket.io server' },
      { status: 500 }
    )
  }
} 