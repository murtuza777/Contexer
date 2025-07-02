import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { projectId, aiAssistant } = await request.json()
    
    // Get user from session
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create new AI session
    const { data: session, error: sessionError } = await supabase
      .from('ai_sessions')
      .insert({
        project_id: projectId,
        user_id: user.id,
        session_type: 'build',
        ai_assistant: aiAssistant || 'cursor',
        status: 'active'
      })
      .select()
      .single()

    if (sessionError) {
      throw new Error(`Failed to create session: ${sessionError.message}`)
    }

    // Update project status to building
    await supabase
      .from('projects')
      .update({ 
        status: 'building',
        build_progress: 0
      })
      .eq('id', projectId)

    // Log initial build start prompt
    await supabase
      .from('prompts')
      .insert({
        session_id: session.id,
        project_id: projectId,
        user_id: user.id,
        prompt_type: 'generate',
        prompt_text: `Initialize autonomous build for ${project.name}: ${project.description}`,
        context_data: {
          projectType: project.project_type,
          techStack: project.tech_stack,
          aiAssistant: aiAssistant
        },
        success: true,
        ai_response: 'Build session started successfully'
      })

    return NextResponse.json({ 
      success: true, 
      sessionId: session.id,
      message: 'VibePilot build session started'
    })

  } catch (error) {
    console.error('Start build error:', error)
    return NextResponse.json(
      { error: 'Failed to start build session' },
      { status: 500 }
    )
  }
} 