import { Server as HTTPServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { ContexterSocketServer } from './socket-server'

let io: SocketIOServer | undefined
let contexterServer: ContexterSocketServer | undefined

export const config = {
  api: {
    bodyParser: false,
  },
}

export function initializeSocket(server: HTTPServer): ContexterSocketServer {
  if (!contexterServer) {
    console.log('Initializing Contexer Socket Server...')
    contexterServer = new ContexterSocketServer(server)
    io = contexterServer['io'] // Access private io property
    console.log('Contexer Socket Server initialized successfully')
  }
  
  return contexterServer
}

export function getSocketServer(): ContexterSocketServer | undefined {
  return contexterServer
}

export function getIO(): SocketIOServer | undefined {
  return io
}

// Next.js API route handler for Socket.io
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Type assertion to access socket server
  const socketServer = (res.socket as any)?.server as HTTPServer & { io?: ContexterSocketServer }
  
  if (!socketServer?.io) {
    console.log('Setting up Socket.io server...')
    
    const httpServer = socketServer as HTTPServer
    const contexterSocketServer = initializeSocket(httpServer)
    
    socketServer.io = contexterSocketServer
    
    console.log('Socket.io server setup complete')
  } else {
    console.log('Socket.io server already running')
  }
  
  res.end()
} 