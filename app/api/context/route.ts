import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables. Context API will return mock data.')
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Mock data for when Supabase is not configured
const mockContexts = [
  {
    id: 'mock-context-1',
    name: 'Sample Project',
    description: 'A sample project for demonstration',
    user_stories: ['User can sign up', 'User can log in'],
    tech_stack: ['Next.js', 'Tailwind CSS'],
    target_audience: 'General users',
    features: ['Authentication', 'Dashboard'],
    requirements: 'Responsive design',
    design_preferences: 'Modern, clean',
    deployment_platform: 'Vercel',
    timeline: '2 weeks',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// GET - List all contexts for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Return mock data if Supabase is not configured
    if (!supabase) {
      return NextResponse.json({ 
        success: true, 
        data: mockContexts, 
        error: null 
      })
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        context_data,
        user_stories,
        tech_stack,
        target_audience,
        features,
        requirements,
        design_preferences,
        deployment_platform,
        timeline,
        template_id,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching contexts:', error)
      return NextResponse.json({ error: 'Failed to fetch contexts' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: projects || [],
      count: projects?.length || 0
    })

  } catch (error) {
    console.error('Context API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new context
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      name,
      description,
      context_data,
      user_stories,
      tech_stack,
      target_audience,
      features,
      requirements,
      design_preferences,
      deployment_platform,
      timeline,
      template_id
    } = body

    if (!userId || !name) {
      return NextResponse.json({ 
        error: 'User ID and project name are required' 
      }, { status: 400 })
    }

    // Create the project with context data
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name,
        description: description || '',
        status: 'draft',
        context_data: context_data || {},
        user_stories: user_stories || [],
        tech_stack: tech_stack || [],
        target_audience: target_audience || '',
        features: features || [],
        requirements: requirements || '',
        design_preferences: design_preferences || '',
        deployment_platform: deployment_platform || '',
        timeline: timeline || '',
        template_id: template_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating context:', error)
      return NextResponse.json({ error: 'Failed to create context' }, { status: 500 })
    }

    // Create initial revision
    await supabase
      .from('project_revisions')
      .insert({
        project_id: project.id,
        revision_number: 1,
        context_data: context_data || {},
        user_stories: user_stories || [],
        tech_stack: tech_stack || [],
        changes_summary: 'Initial context creation',
        created_by: userId
      })

    return NextResponse.json({ 
      success: true, 
      data: project 
    }, { status: 201 })

  } catch (error) {
    console.error('Context creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update an existing context
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      projectId,
      userId,
      name,
      description,
      context_data,
      user_stories,
      tech_stack,
      target_audience,
      features,
      requirements,
      design_preferences,
      deployment_platform,
      timeline,
      changes_summary
    } = body

    if (!projectId || !userId) {
      return NextResponse.json({ 
        error: 'Project ID and User ID are required' 
      }, { status: 400 })
    }

    // Check if user owns the project
    const { data: existingProject, error: checkError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (checkError || !existingProject) {
      return NextResponse.json({ 
        error: 'Project not found or access denied' 
      }, { status: 404 })
    }

    // Update the project
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        name,
        description,
        context_data,
        user_stories,
        tech_stack,
        target_audience,
        features,
        requirements,
        design_preferences,
        deployment_platform,
        timeline
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating context:', error)
      return NextResponse.json({ error: 'Failed to update context' }, { status: 500 })
    }

    // Create a new revision
    const { data: lastRevision } = await supabase
      .from('project_revisions')
      .select('revision_number')
      .eq('project_id', projectId)
      .order('revision_number', { ascending: false })
      .limit(1)
      .single()

    const newRevisionNumber = (lastRevision?.revision_number || 0) + 1

    await supabase
      .from('project_revisions')
      .insert({
        project_id: projectId,
        revision_number: newRevisionNumber,
        context_data,
        user_stories,
        tech_stack,
        changes_summary: changes_summary || 'Context updated',
        created_by: userId
      })

    return NextResponse.json({ 
      success: true, 
      data: project 
    })

  } catch (error) {
    console.error('Context update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a context
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')

    if (!projectId || !userId) {
      return NextResponse.json({ 
        error: 'Project ID and User ID are required' 
      }, { status: 400 })
    }

    // Delete the project (cascade will handle related records)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting context:', error)
      return NextResponse.json({ error: 'Failed to delete context' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Context deleted successfully' 
    })

  } catch (error) {
    console.error('Context deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 