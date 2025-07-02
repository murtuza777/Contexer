import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { AIAgentController } from '@/lib/ai-agent'

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()
    
    // Get user from session (in a real app, you'd extract from JWT/session)
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const aiAgent = new AIAgentController(user.id)

    switch (action) {
      case 'start-session':
        const sessionId = await aiAgent.startSession(
          data.projectId,
          data.sessionType,
          data.aiAssistant
        )
        return NextResponse.json({ success: true, sessionId })

      case 'stop-session':
        await aiAgent.endSession()
        return NextResponse.json({ success: true })

      case 'send-prompt':
        const response = await aiAgent.sendPrompt(data.projectId, data.prompt)
        return NextResponse.json(response)

      case 'auto-fix':
        const fixResponse = await aiAgent.autoFixError(data.projectId, data.error)
        return NextResponse.json(fixResponse)

      case 'generate-prompt':
        const generatedPrompt = await aiAgent.generateSmartPrompt(
          data.projectId,
          data.intention,
          data.files
        )
        return NextResponse.json({ success: true, prompt: generatedPrompt })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('AI API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    switch (action) {
      case 'sessions':
        const { data: sessions } = await supabase
          .from('ai_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        return NextResponse.json(sessions)

      case 'session-stats':
        const sessionId = searchParams.get('sessionId')
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
        }
        
        const aiAgent = new AIAgentController(user.id)
        const stats = await aiAgent.getSessionStats(sessionId)
        
        return NextResponse.json(stats)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('AI API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 