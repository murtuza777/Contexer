export interface ProcessedFile {
  id: string
  name: string
  type: string
  size: number
  content: string
  extractedData: {
    description?: string
    features?: string[]
    techStack?: string[]
    requirements?: string
    installation?: string[]
    usage?: string
    license?: string
    dependencies?: Record<string, string>
  }
  suggestions: string[]
  metadata: {
    wordCount: number
    sections: string[]
    hasCodeBlocks: boolean
    language?: string
    complexity: 'low' | 'medium' | 'high'
  }
}

export interface FileProcessingResult {
  success: boolean
  processedFile?: ProcessedFile
  error?: string
  warnings?: string[]
}

export class FileProcessor {
  private static instance: FileProcessor

  private constructor() {}

  static getInstance(): FileProcessor {
    if (!FileProcessor.instance) {
      FileProcessor.instance = new FileProcessor()
    }
    return FileProcessor.instance
  }

  // Main file processing method
  async processFile(file: File): Promise<FileProcessingResult> {
    try {
      const content = await this.readFileContent(file)
      const fileType = this.determineFileType(file.name, file.type, content)
      
      let extractedData: any = {}
      let suggestions: string[] = []
      let metadata: any = {}

      switch (fileType) {
        case 'markdown':
          const markdownResult = this.processMarkdownFile(content)
          extractedData = markdownResult.extractedData
          suggestions = markdownResult.suggestions
          metadata = markdownResult.metadata
          break
        
        case 'json':
          const jsonResult = this.processJsonFile(content)
          extractedData = jsonResult.extractedData
          suggestions = jsonResult.suggestions
          metadata = jsonResult.metadata
          break
        
        case 'text':
          const textResult = this.processTextFile(content)
          extractedData = textResult.extractedData
          suggestions = textResult.suggestions
          metadata = textResult.metadata
          break
        
        default:
          return {
            success: false,
            error: `Unsupported file type: ${fileType}`,
            warnings: ['Only markdown (.md), JSON (.json), and text (.txt) files are supported']
          }
      }

      const processedFile: ProcessedFile = {
        id: `file_${Date.now()}`,
        name: file.name,
        type: fileType,
        size: file.size,
        content,
        extractedData,
        suggestions,
        metadata: {
          wordCount: this.countWords(content),
          sections: this.extractSections(content),
          hasCodeBlocks: this.hasCodeBlocks(content),
          language: this.detectLanguage(content),
          complexity: this.assessComplexity(content, extractedData),
          ...metadata
        }
      }

      return {
        success: true,
        processedFile
      }
    } catch (error) {
      console.error('File processing error:', error)
      return {
        success: false,
        error: 'Failed to process file',
        warnings: ['Make sure the file is a valid text file']
      }
    }
  }

  // Read file content
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // Determine file type
  private determineFileType(fileName: string, mimeType: string, content: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (extension === 'md' || mimeType === 'text/markdown') {
      return 'markdown'
    }
    
    if (extension === 'json' || mimeType === 'application/json') {
      return 'json'
    }
    
    if (extension === 'txt' || mimeType === 'text/plain') {
      return 'text'
    }

    // Try to detect based on content
    if (content.includes('# ') || content.includes('## ') || content.includes('```')) {
      return 'markdown'
    }
    
    if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
      return 'json'
    }
    
    return 'text'
  }

  // Process Markdown files (README.md, etc.)
  private processMarkdownFile(content: string): {
    extractedData: any
    suggestions: string[]
    metadata: any
  } {
    const lines = content.split('\n')
    const sections: { [key: string]: string[] } = {}
    let currentSection = 'description'
    let currentContent: string[] = []

    // Parse sections
    for (const line of lines) {
      if (line.startsWith('#')) {
        // Save previous section
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.filter(l => l.trim())
        }
        
        // Start new section
        const heading = line.replace(/^#+\s*/, '').toLowerCase()
        currentSection = this.categorizeSection(heading)
        currentContent = []
      } else {
        currentContent.push(line)
      }
    }
    
    // Save final section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.filter(l => l.trim())
    }

    // Extract structured data
    const extractedData = {
      description: this.extractDescription(sections),
      features: this.extractFeatures(sections),
      techStack: this.extractTechStack(sections, content),
      requirements: this.extractRequirements(sections),
      installation: this.extractInstallation(sections),
      usage: this.extractUsage(sections),
      license: this.extractLicense(sections),
      dependencies: this.extractDependencies(content)
    }

    // Generate suggestions
    const suggestions = this.generateMarkdownSuggestions(extractedData, sections)

    // Additional metadata
    const metadata = {
      hasTableOfContents: content.includes('## Table of Contents') || content.includes('# Table of Contents'),
      hasBadges: content.includes('![') && content.includes('shields.io'),
      hasCodeExamples: this.hasCodeBlocks(content),
      sectionCount: Object.keys(sections).length
    }

    return { extractedData, suggestions, metadata }
  }

  // Process JSON files (package.json, etc.)
  private processJsonFile(content: string): {
    extractedData: any
    suggestions: string[]
    metadata: any
  } {
    try {
      const jsonData = JSON.parse(content)
      const extractedData: any = {}
      const suggestions: string[] = []

      // Package.json specific processing
      if (jsonData.name || jsonData.dependencies || jsonData.scripts) {
        extractedData.description = jsonData.description
        extractedData.techStack = this.extractTechStackFromPackageJson(jsonData)
        extractedData.dependencies = jsonData.dependencies || {}
        
        if (jsonData.scripts) {
          suggestions.push('Package.json detected - consider adding npm scripts to your project setup')
        }
        
        if (jsonData.dependencies) {
          suggestions.push(`Found ${Object.keys(jsonData.dependencies).length} dependencies - update your tech stack`)
        }
      }

      // Generic JSON processing
      if (jsonData.features) {
        extractedData.features = Array.isArray(jsonData.features) ? jsonData.features : [jsonData.features]
      }

      if (jsonData.requirements) {
        extractedData.requirements = typeof jsonData.requirements === 'string' 
          ? jsonData.requirements 
          : JSON.stringify(jsonData.requirements, null, 2)
      }

      const metadata = {
        isPackageJson: !!(jsonData.name && jsonData.dependencies),
        hasScripts: !!jsonData.scripts,
        dependencyCount: jsonData.dependencies ? Object.keys(jsonData.dependencies).length : 0
      }

      return { extractedData, suggestions, metadata }
    } catch (error) {
      return {
        extractedData: {},
        suggestions: ['Invalid JSON format - please check file syntax'],
        metadata: { isValidJson: false }
      }
    }
  }

  // Process plain text files
  private processTextFile(content: string): {
    extractedData: any
    suggestions: string[]
    metadata: any
  } {
    const lines = content.split('\n').filter(line => line.trim())
    const extractedData: any = {}
    const suggestions: string[] = []

    // Try to extract basic information
    if (lines.length > 0) {
      extractedData.description = lines.slice(0, 3).join(' ').substring(0, 500)
    }

    // Look for feature lists
    const featureLines = lines.filter(line => 
      line.trim().startsWith('-') || 
      line.trim().startsWith('*') ||
      line.trim().match(/^\d+\./)
    )

    if (featureLines.length > 0) {
      extractedData.features = featureLines.map(line => 
        line.replace(/^[\s\-\*\d\.]+/, '').trim()
      ).filter(feature => feature.length > 0)
    }

    // Generate suggestions
    if (extractedData.description) {
      suggestions.push('Text content detected - consider formatting as Markdown for better structure')
    }

    if (featureLines.length > 0) {
      suggestions.push('Feature list detected - add these to your project features')
    }

    const metadata = {
      lineCount: lines.length,
      hasLists: featureLines.length > 0,
      avgLineLength: lines.reduce((acc, line) => acc + line.length, 0) / lines.length
    }

    return { extractedData, suggestions, metadata }
  }

  // Helper methods for content analysis
  private categorizeSection(heading: string): string {
    const lowerHeading = heading.toLowerCase()
    
    if (lowerHeading.includes('feature') || lowerHeading.includes('functionality')) {
      return 'features'
    } else if (lowerHeading.includes('tech') || lowerHeading.includes('stack') || 
               lowerHeading.includes('dependencies') || lowerHeading.includes('built with')) {
      return 'techStack'
    } else if (lowerHeading.includes('requirement') || lowerHeading.includes('prerequisite') ||
               lowerHeading.includes('spec')) {
      return 'requirements'
    } else if (lowerHeading.includes('install') || lowerHeading.includes('setup') ||
               lowerHeading.includes('getting started')) {
      return 'installation'
    } else if (lowerHeading.includes('usage') || lowerHeading.includes('how to') ||
               lowerHeading.includes('example')) {
      return 'usage'
    } else if (lowerHeading.includes('license')) {
      return 'license'
    } else if (lowerHeading.includes('design') || lowerHeading.includes('ui') || 
               lowerHeading.includes('ux') || lowerHeading.includes('style')) {
      return 'design'
    } else if (lowerHeading.includes('deploy') || lowerHeading.includes('production')) {
      return 'deployment'
    } else {
      return 'description'
    }
  }

  private extractDescription(sections: { [key: string]: string[] }): string {
    const descSections = sections.description || []
    return descSections.join('\n').trim().substring(0, 1000)
  }

  private extractFeatures(sections: { [key: string]: string[] }): string[] {
    const featureSections = sections.features || []
    const features: string[] = []
    
    for (const line of featureSections) {
      if (line.trim().startsWith('-') || line.trim().startsWith('*') || 
          line.trim().match(/^\d+\./)) {
        const feature = line.replace(/^[\s\-\*\d\.]+/, '').trim()
        if (feature) features.push(feature)
      }
    }
    
    return features
  }

  private extractTechStack(sections: { [key: string]: string[] }, content: string): string[] {
    const techSections = sections.techStack || []
    const techStack = new Set<string>()
    
    // Common tech patterns
    const techPatterns = [
      /react/i, /vue/i, /angular/i, /svelte/i, /next\.js/i, /nuxt/i,
      /node\.js/i, /express/i, /fastapi/i, /django/i, /flask/i,
      /typescript/i, /javascript/i, /python/i, /java/i, /go/i, /rust/i,
      /postgresql/i, /mysql/i, /mongodb/i, /redis/i, /supabase/i, /firebase/i,
      /docker/i, /kubernetes/i, /aws/i, /vercel/i, /netlify/i,
      /tailwind/i, /chakra/i, /material-ui/i, /bootstrap/i
    ]
    
    // Check tech sections
    for (const line of techSections) {
      for (const pattern of techPatterns) {
        const match = line.match(pattern)
        if (match) {
          techStack.add(this.normalizeTechName(match[0]))
        }
      }
    }
    
    // Check entire content for tech stack mentions
    for (const pattern of techPatterns) {
      const matches = content.match(new RegExp(pattern.source, 'gi'))
      if (matches) {
        matches.forEach(match => techStack.add(this.normalizeTechName(match)))
      }
    }
    
    return Array.from(techStack)
  }

  private normalizeTechName(tech: string): string {
    const normalized = tech.toLowerCase().trim()
    
    const normalizations: { [key: string]: string } = {
      'react': 'React',
      'vue': 'Vue.js',
      'angular': 'Angular',
      'svelte': 'Svelte',
      'next.js': 'Next.js',
      'nuxt': 'Nuxt.js',
      'node.js': 'Node.js',
      'express': 'Express',
      'fastapi': 'FastAPI',
      'django': 'Django',
      'flask': 'Flask',
      'typescript': 'TypeScript',
      'javascript': 'JavaScript',
      'python': 'Python',
      'java': 'Java',
      'go': 'Go',
      'rust': 'Rust',
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'mongodb': 'MongoDB',
      'redis': 'Redis',
      'supabase': 'Supabase',
      'firebase': 'Firebase',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'aws': 'AWS',
      'vercel': 'Vercel',
      'netlify': 'Netlify',
      'tailwind': 'Tailwind CSS',
      'chakra': 'Chakra UI',
      'material-ui': 'Material-UI',
      'bootstrap': 'Bootstrap'
    }
    
    return normalizations[normalized] || tech
  }

  private extractRequirements(sections: { [key: string]: string[] }): string {
    const reqSections = sections.requirements || []
    return reqSections.join('\n').trim()
  }

  private extractInstallation(sections: { [key: string]: string[] }): string[] {
    const installSections = sections.installation || []
    const steps: string[] = []
    
    for (const line of installSections) {
      if (line.trim().startsWith('```') || line.trim().startsWith('`')) {
        // Extract code blocks as installation steps
        const cleanLine = line.replace(/```[a-z]*|`/g, '').trim()
        if (cleanLine) steps.push(cleanLine)
      } else if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
        const step = line.replace(/^[\s\-\d\.]+/, '').trim()
        if (step) steps.push(step)
      }
    }
    
    return steps
  }

  private extractUsage(sections: { [key: string]: string[] }): string {
    const usageSections = sections.usage || []
    return usageSections.join('\n').trim()
  }

  private extractLicense(sections: { [key: string]: string[] }): string {
    const licenseSections = sections.license || []
    return licenseSections.join(' ').trim()
  }

  private extractDependencies(content: string): Record<string, string> {
    const dependencies: Record<string, string> = {}
    
    // Look for package.json-like dependency declarations
    const depPattern = /"([^"]+)":\s*"([^"]+)"/g
    let match
    
    while ((match = depPattern.exec(content)) !== null) {
      if (match[2].match(/^\d+\.|^\^|^~/)) { // Version pattern
        dependencies[match[1]] = match[2]
      }
    }
    
    return dependencies
  }

  private extractTechStackFromPackageJson(jsonData: any): string[] {
    const techStack = new Set<string>()
    
    // Dependencies
    if (jsonData.dependencies) {
      Object.keys(jsonData.dependencies).forEach(dep => {
        const normalized = this.normalizeTechName(dep)
        if (normalized !== dep) { // Only add if we have a normalization
          techStack.add(normalized)
        }
      })
    }
    
    // Dev dependencies
    if (jsonData.devDependencies) {
      Object.keys(jsonData.devDependencies).forEach(dep => {
        const normalized = this.normalizeTechName(dep)
        if (normalized !== dep) {
          techStack.add(normalized)
        }
      })
    }
    
    return Array.from(techStack)
  }

  private generateMarkdownSuggestions(extractedData: any, sections: { [key: string]: string[] }): string[] {
    const suggestions: string[] = []
    
    if (extractedData.description) {
      suggestions.push('Project description found - consider using this for your project description')
    }
    
    if (extractedData.features?.length > 0) {
      suggestions.push(`${extractedData.features.length} features detected - add these to your project features`)
    }
    
    if (extractedData.techStack?.length > 0) {
      suggestions.push(`Technology stack found: ${extractedData.techStack.slice(0, 3).join(', ')} - update your tech selection`)
    }
    
    if (extractedData.requirements) {
      suggestions.push('Technical requirements found - add these to your requirements section')
    }
    
    if (extractedData.installation?.length > 0) {
      suggestions.push('Installation steps found - useful for project setup documentation')
    }
    
    if (sections.design && sections.design.length > 0) {
      suggestions.push('Design information found - incorporate into design preferences')
    }
    
    if (sections.deployment && sections.deployment.length > 0) {
      suggestions.push('Deployment information found - update deployment platform settings')
    }
    
    return suggestions
  }

  // Utility methods
  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length
  }

  private extractSections(content: string): string[] {
    const sections: string[] = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('#')) {
        const section = line.replace(/^#+\s*/, '').trim()
        if (section) sections.push(section)
      }
    }
    
    return sections
  }

  private hasCodeBlocks(content: string): boolean {
    return content.includes('```') || content.includes('`')
  }

  private detectLanguage(content: string): string | undefined {
    // Simple language detection based on common patterns
    if (content.includes('npm install') || content.includes('package.json')) {
      return 'javascript'
    }
    if (content.includes('pip install') || content.includes('requirements.txt')) {
      return 'python'
    }
    if (content.includes('composer install') || content.includes('<?php')) {
      return 'php'
    }
    if (content.includes('gem install') || content.includes('Gemfile')) {
      return 'ruby'
    }
    if (content.includes('go mod') || content.includes('package main')) {
      return 'go'
    }
    
    return undefined
  }

  private assessComplexity(content: string, extractedData: any): 'low' | 'medium' | 'high' {
    let score = 0
    
    // Word count
    const wordCount = this.countWords(content)
    if (wordCount > 1000) score += 2
    else if (wordCount > 500) score += 1
    
    // Tech stack size
    const techStackSize = extractedData.techStack?.length || 0
    if (techStackSize > 8) score += 3
    else if (techStackSize > 4) score += 2
    else if (techStackSize > 2) score += 1
    
    // Feature count
    const featureCount = extractedData.features?.length || 0
    if (featureCount > 15) score += 3
    else if (featureCount > 8) score += 2
    else if (featureCount > 4) score += 1
    
    // Code blocks and technical content
    if (this.hasCodeBlocks(content)) score += 1
    if (extractedData.dependencies && Object.keys(extractedData.dependencies).length > 10) score += 2
    
    if (score >= 6) return 'high'
    if (score >= 3) return 'medium'
    return 'low'
  }

  // Public utility methods
  getSupportedFileTypes(): string[] {
    return ['md', 'txt', 'json']
  }

  getMaxFileSize(): number {
    return 5 * 1024 * 1024 // 5MB
  }

  validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (file.size > this.getMaxFileSize()) {
      errors.push(`File size exceeds maximum limit of ${this.getMaxFileSize() / 1024 / 1024}MB`)
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !this.getSupportedFileTypes().includes(extension)) {
      errors.push(`File type .${extension} not supported. Supported types: ${this.getSupportedFileTypes().join(', ')}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
} 