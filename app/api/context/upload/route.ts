import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Upload and process project files
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const userId = formData.get('userId') as string

    if (!file || !projectId || !userId) {
      return NextResponse.json({ 
        error: 'File, project ID, and user ID are required' 
      }, { status: 400 })
    }

    // Check if user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ 
        error: 'Project not found or access denied' 
      }, { status: 404 })
    }

    // Read file content
    const fileContent = await file.text()
    const fileName = file.name
    const fileSize = file.size
    const fileType = file.type || getFileTypeFromName(fileName)

    // Store file record in database
    const { data: fileRecord, error: fileError } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        file_content: fileContent,
        uploaded_by: userId
      })
      .select()
      .single()

    if (fileError) {
      console.error('Error storing file record:', fileError)
      return NextResponse.json({ error: 'Failed to store file' }, { status: 500 })
    }

    // Process file content based on type
    let processedData = null
    if (fileName.toLowerCase() === 'readme.md' || fileType === 'text/markdown') {
      processedData = processMarkdownFile(fileContent)
    } else if (fileType === 'application/json') {
      try {
        processedData = JSON.parse(fileContent)
      } catch (error) {
        console.warn('Failed to parse JSON file:', error)
      }
    }

    // Update project's uploaded_files array
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .select('uploaded_files')
      .eq('id', projectId)
      .single()

    if (!updateError && updatedProject) {
      const currentFiles = updatedProject.uploaded_files || []
      const newFilesArray = [...currentFiles, {
        id: fileRecord.id,
        name: fileName,
        type: fileType,
        size: fileSize,
        uploadedAt: new Date().toISOString(),
        processed: !!processedData
      }]

      await supabase
        .from('projects')
        .update({ uploaded_files: newFilesArray })
        .eq('id', projectId)
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        file: fileRecord,
        processed: processedData,
        suggestions: processedData ? generateSuggestions(processedData, fileName) : null
      }
    }, { status: 201 })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Retrieve uploaded files for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')

    if (!projectId || !userId) {
      return NextResponse.json({ 
        error: 'Project ID and User ID are required' 
      }, { status: 400 })
    }

    // Check if user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ 
        error: 'Project not found or access denied' 
      }, { status: 404 })
    }

    // Get uploaded files
    const { data: files, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching files:', error)
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: files || []
    })

  } catch (error) {
    console.error('File retrieval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove an uploaded file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')

    if (!fileId || !projectId || !userId) {
      return NextResponse.json({ 
        error: 'File ID, Project ID, and User ID are required' 
      }, { status: 400 })
    }

    // Check if user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, uploaded_files')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ 
        error: 'Project not found or access denied' 
      }, { status: 404 })
    }

    // Delete the file record
    const { error: deleteError } = await supabase
      .from('project_files')
      .delete()
      .eq('id', fileId)
      .eq('project_id', projectId)

    if (deleteError) {
      console.error('Error deleting file:', deleteError)
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }

    // Update project's uploaded_files array
    const currentFiles = project.uploaded_files || []
    const updatedFiles = currentFiles.filter((file: any) => file.id !== fileId)

    await supabase
      .from('projects')
      .update({ uploaded_files: updatedFiles })
      .eq('id', projectId)

    return NextResponse.json({ 
      success: true, 
      message: 'File deleted successfully' 
    })

  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function getFileTypeFromName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const typeMap: { [key: string]: string } = {
    'md': 'text/markdown',
    'txt': 'text/plain',
    'json': 'application/json',
    'js': 'application/javascript',
    'ts': 'application/typescript',
    'jsx': 'application/javascript',
    'tsx': 'application/typescript',
    'html': 'text/html',
    'css': 'text/css',
    'py': 'text/x-python',
    'java': 'text/x-java',
    'c': 'text/x-c',
    'cpp': 'text/x-c++',
    'h': 'text/x-c',
    'hpp': 'text/x-c++',
    'xml': 'application/xml',
    'yaml': 'application/yaml',
    'yml': 'application/yaml'
  }
  
  return typeMap[extension || ''] || 'text/plain'
}

function processMarkdownFile(content: string) {
  // Extract sections from README.md
  const sections: { [key: string]: string } = {}
  const lines = content.split('\n')
  
  let currentSection = 'description'
  let currentContent: string[] = []
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim()
      }
      
      // Start new section
      const heading = line.replace(/^#+\s*/, '').toLowerCase()
      if (heading.includes('feature') || heading.includes('functionality')) {
        currentSection = 'features'
      } else if (heading.includes('tech') || heading.includes('stack') || heading.includes('dependencies')) {
        currentSection = 'tech_stack'
      } else if (heading.includes('requirement') || heading.includes('spec')) {
        currentSection = 'requirements'
      } else if (heading.includes('design') || heading.includes('ui') || heading.includes('ux')) {
        currentSection = 'design'
      } else if (heading.includes('deploy') || heading.includes('installation')) {
        currentSection = 'deployment'
      } else {
        currentSection = 'description'
      }
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }
  
  // Save final section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim()
  }
  
  return sections
}

function generateSuggestions(processedData: any, fileName: string) {
  const suggestions: string[] = []
  
  if (fileName.toLowerCase() === 'readme.md') {
    if (processedData.features) {
      suggestions.push('Features section found - consider adding these to your project features')
    }
    if (processedData.tech_stack) {
      suggestions.push('Technology stack information found - update your tech stack selection')
    }
    if (processedData.requirements) {
      suggestions.push('Requirements section found - add these to your technical requirements')
    }
    if (processedData.design) {
      suggestions.push('Design information found - incorporate into design preferences')
    }
  }
  
  return suggestions
} 