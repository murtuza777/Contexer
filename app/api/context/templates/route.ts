import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables. Templates API will return mock data.')
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Mock templates for when Supabase is not configured
const mockTemplates = [
  {
    id: 'mock-1',
    name: 'E-commerce Store',
    category: 'E-commerce',
    description: 'A modern e-commerce platform with cart, checkout, and payment processing',
    tech_stack: { frontend: 'Next.js', backend: 'Supabase', styling: 'Tailwind CSS' },
    template_data: {},
    user_stories: ['User can browse products', 'User can add items to cart'],
    features: ['Product catalog', 'Shopping cart', 'Checkout'],
    requirements: ['Responsive design', 'Fast loading'],
    design_preferences: ['Modern', 'Clean'],
    deployment_platform: 'Vercel',
    is_public: true,
    created_at: new Date().toISOString()
  }
]

// GET - List context templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const publicOnly = searchParams.get('public') === 'true'
    const userId = searchParams.get('userId')

    // Return mock data if Supabase is not configured
    if (!supabase) {
      let filteredTemplates = mockTemplates
      if (category && category !== 'all') {
        filteredTemplates = filteredTemplates.filter(t => t.category === category)
      }
      return NextResponse.json({ data: filteredTemplates, error: null })
    }

    let query = supabase
      .from('context_templates')
      .select(`
        id,
        name,
        category,
        description,
        tech_stack,
        template_data,
        user_stories,
        features,
        requirements,
        design_preferences,
        deployment_platform,
        is_public,
        created_at
      `)

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category)
    }

    // Filter by public templates or user's own templates
    if (publicOnly) {
      query = query.eq('is_public', true)
    } else if (userId) {
      query = query.or(`is_public.eq.true,created_by.eq.${userId}`)
    } else {
      query = query.eq('is_public', true)
    }

    const { data: templates, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: templates || [],
      count: templates?.length || 0
    })

  } catch (error) {
    console.error('Templates API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      name,
      category,
      description,
      tech_stack,
      template_data,
      user_stories,
      features,
      requirements,
      design_preferences,
      deployment_platform,
      is_public
    } = body

    if (!userId || !name || !category) {
      return NextResponse.json({ 
        error: 'User ID, name, and category are required' 
      }, { status: 400 })
    }

    // Return error if Supabase is not configured
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 503 })
    }

    // Create the template
    const { data: template, error } = await supabase
      .from('context_templates')
      .insert({
        name,
        category,
        description: description || '',
        tech_stack: tech_stack || {},
        template_data: template_data || {},
        user_stories: user_stories || [],
        features: features || [],
        requirements: requirements || '',
        design_preferences: design_preferences || '',
        deployment_platform: deployment_platform || '',
        is_public: is_public || false,
        created_by: userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: template 
    }, { status: 201 })

  } catch (error) {
    console.error('Template creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      templateId,
      userId,
      name,
      category,
      description,
      tech_stack,
      template_data,
      user_stories,
      features,
      requirements,
      design_preferences,
      deployment_platform,
      is_public
    } = body

    if (!templateId || !userId) {
      return NextResponse.json({ 
        error: 'Template ID and User ID are required' 
      }, { status: 400 })
    }

    // Return error if Supabase is not configured
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 503 })
    }

    // Check if user owns the template
    const { data: existingTemplate, error: checkError } = await supabase
      .from('context_templates')
      .select('id, created_by')
      .eq('id', templateId)
      .eq('created_by', userId)
      .single()

    if (checkError || !existingTemplate) {
      return NextResponse.json({ 
        error: 'Template not found or access denied' 
      }, { status: 404 })
    }

    // Update the template
    const { data: template, error } = await supabase
      .from('context_templates')
      .update({
        name,
        category,
        description,
        tech_stack,
        template_data,
        user_stories,
        features,
        requirements,
        design_preferences,
        deployment_platform,
        is_public
      })
      .eq('id', templateId)
      .eq('created_by', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: template 
    })

  } catch (error) {
    console.error('Template update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')
    const userId = searchParams.get('userId')

    if (!templateId || !userId) {
      return NextResponse.json({ 
        error: 'Template ID and User ID are required' 
      }, { status: 400 })
    }

    // Return error if Supabase is not configured
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 503 })
    }

    // Delete the template
    const { error } = await supabase
      .from('context_templates')
      .delete()
      .eq('id', templateId)
      .eq('created_by', userId)

    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Template deleted successfully' 
    })

  } catch (error) {
    console.error('Template deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 