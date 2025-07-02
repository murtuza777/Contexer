import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import axios from 'axios'
import * as chokidar from 'chokidar'

interface VibePilotConfig {
  apiUrl: string
  aiAssistant: string
  autoMonitoring: boolean
  promptInterval: number
}

class VibePilotExtension {
  private context: vscode.ExtensionContext
  private config: VibePilotConfig
  private sessionActive = false
  private fileWatcher: chokidar.FSWatcher | null = null
  private statusBarItem: vscode.StatusBarItem
  private outputChannel: vscode.OutputChannel

  constructor(context: vscode.ExtensionContext) {
    this.context = context
    this.config = this.loadConfig()
    this.outputChannel = vscode.window.createOutputChannel('VibePilot')
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    )
    this.updateStatusBar()
  }

  private loadConfig(): VibePilotConfig {
    const config = vscode.workspace.getConfiguration('vibepilot')
    return {
      apiUrl: config.get('apiUrl', 'http://localhost:3000'),
      aiAssistant: config.get('aiAssistant', 'cursor'),
      autoMonitoring: config.get('autoMonitoring', true),
      promptInterval: config.get('promptInterval', 5)
    }
  }

  async startSession() {
    if (this.sessionActive) {
      vscode.window.showWarningMessage('VibePilot session is already active')
      return
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('Please open a workspace folder first')
      return
    }

    try {
      // Get or create project
      const projectData = await this.getOrCreateProject(workspaceFolder)
      
      // Start AI session
      const response = await axios.post(`${this.config.apiUrl}/api/ai/start-session`, {
        projectId: projectData.id,
        sessionType: 'build',
        aiAssistant: this.config.aiAssistant
      })

      this.sessionActive = true
      this.updateStatusBar()
      
      // Start file monitoring if enabled
      if (this.config.autoMonitoring) {
        this.startFileWatcher(workspaceFolder.uri.fsPath)
      }

      this.outputChannel.appendLine(`🚀 VibePilot session started for project: ${projectData.name}`)
      this.outputChannel.show()

      vscode.window.showInformationMessage(
        `VibePilot session started! AI assistant "${this.config.aiAssistant}" is now monitoring your project.`
      )

      // Set context for when clause
      vscode.commands.executeCommand('setContext', 'vibepilot.sessionActive', true)

    } catch (error) {
      this.outputChannel.appendLine(`❌ Failed to start session: ${error}`)
      vscode.window.showErrorMessage(`Failed to start VibePilot session: ${error}`)
    }
  }

  async stopSession() {
    if (!this.sessionActive) {
      vscode.window.showWarningMessage('No active VibePilot session')
      return
    }

    try {
      await axios.post(`${this.config.apiUrl}/api/ai/stop-session`)
      
      this.sessionActive = false
      this.updateStatusBar()
      
      // Stop file watcher
      if (this.fileWatcher) {
        this.fileWatcher.close()
        this.fileWatcher = null
      }

      this.outputChannel.appendLine('🛑 VibePilot session stopped')
      
      vscode.window.showInformationMessage('VibePilot session stopped')
      
      // Set context for when clause
      vscode.commands.executeCommand('setContext', 'vibepilot.sessionActive', false)

    } catch (error) {
      this.outputChannel.appendLine(`❌ Failed to stop session: ${error}`)
      vscode.window.showErrorMessage(`Failed to stop VibePilot session: ${error}`)
    }
  }

  async sendCustomPrompt() {
    if (!this.sessionActive) {
      vscode.window.showWarningMessage('Please start a VibePilot session first')
      return
    }

    const prompt = await vscode.window.showInputBox({
      title: 'Send Custom Prompt',
      prompt: 'Enter your prompt for the AI assistant',
      placeHolder: 'e.g., Add error handling to the login function'
    })

    if (!prompt) return

    try {
      this.outputChannel.appendLine(`📤 Sending prompt: ${prompt}`)
      
      const response = await axios.post(`${this.config.apiUrl}/api/ai/send-prompt`, {
        prompt: {
          type: 'custom',
          text: prompt,
          context: {
            files: this.getCurrentFileContext()
          }
        }
      })

      if (response.data.success) {
        this.outputChannel.appendLine(`✅ Prompt executed successfully`)
        vscode.window.showInformationMessage('Prompt sent successfully!')
      } else {
        this.outputChannel.appendLine(`❌ Prompt failed: ${response.data.error}`)
        vscode.window.showErrorMessage(`Prompt failed: ${response.data.error}`)
      }

    } catch (error) {
      this.outputChannel.appendLine(`❌ Failed to send prompt: ${error}`)
      vscode.window.showErrorMessage(`Failed to send prompt: ${error}`)
    }
  }

  async openDashboard() {
    const panel = vscode.window.createWebviewPanel(
      'vibepilotDashboard',
      'VibePilot Dashboard',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [this.context.extensionUri]
      }
    )

    panel.webview.html = this.getDashboardHtml()
  }

  async autoFixErrors() {
    if (!this.sessionActive) {
      vscode.window.showWarningMessage('Please start a VibePilot session first')
      return
    }

    try {
      // Get current diagnostics (errors/warnings)
      const diagnostics = vscode.languages.getDiagnostics()
      const errors = []

      for (const [uri, diags] of diagnostics) {
        for (const diagnostic of diags) {
          if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
            errors.push({
              file: uri.fsPath,
              line: diagnostic.range.start.line + 1,
              message: diagnostic.message,
              range: diagnostic.range
            })
          }
        }
      }

      if (errors.length === 0) {
        vscode.window.showInformationMessage('No errors found to fix!')
        return
      }

      this.outputChannel.appendLine(`🔍 Found ${errors.length} errors, attempting to auto-fix...`)

      for (const error of errors) {
        const response = await axios.post(`${this.config.apiUrl}/api/ai/auto-fix`, {
          error: error
        })

        if (response.data.success) {
          this.outputChannel.appendLine(`✅ Fixed error: ${error.message}`)
        } else {
          this.outputChannel.appendLine(`❌ Failed to fix error: ${error.message}`)
        }
      }

      vscode.window.showInformationMessage(`Auto-fix completed! Check output for details.`)

    } catch (error) {
      this.outputChannel.appendLine(`❌ Auto-fix failed: ${error}`)
      vscode.window.showErrorMessage(`Auto-fix failed: ${error}`)
    }
  }

  private startFileWatcher(workspacePath: string) {
    this.fileWatcher = chokidar.watch(workspacePath, {
      ignored: /node_modules|\.git|\.vscode/,
      persistent: true
    })

    this.fileWatcher.on('change', (filePath) => {
      this.outputChannel.appendLine(`📝 File changed: ${filePath}`)
      // Could trigger automatic analysis here
    })

    this.fileWatcher.on('add', (filePath) => {
      this.outputChannel.appendLine(`➕ File added: ${filePath}`)
    })
  }

  private async getOrCreateProject(workspaceFolder: vscode.WorkspaceFolder) {
    const projectName = path.basename(workspaceFolder.uri.fsPath)
    
    try {
      // Try to get existing project
      const response = await axios.get(`${this.config.apiUrl}/api/projects`, {
        params: { name: projectName }
      })
      
      if (response.data && response.data.length > 0) {
        return response.data[0]
      }
    } catch (error) {
      // Project doesn't exist, create it
    }

    // Create new project
    const packageJsonPath = path.join(workspaceFolder.uri.fsPath, 'package.json')
    let techStack = []
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
        techStack = Object.keys({
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        })
      } catch (error) {
        // Ignore package.json parsing errors
      }
    }

    const createResponse = await axios.post(`${this.config.apiUrl}/api/projects`, {
      name: projectName,
      description: `Auto-created project for ${projectName}`,
      projectType: 'web', // Default to web
      techStack: techStack,
      localPath: workspaceFolder.uri.fsPath,
      aiAssistant: this.config.aiAssistant
    })

    return createResponse.data
  }

  private getCurrentFileContext(): string[] {
    const activeEditor = vscode.window.activeTextEditor
    if (activeEditor) {
      return [activeEditor.document.uri.fsPath]
    }
    return []
  }

  private updateStatusBar() {
    if (this.sessionActive) {
      this.statusBarItem.text = '$(robot) VibePilot Active'
      this.statusBarItem.color = '#00ff00'
      this.statusBarItem.tooltip = 'VibePilot is monitoring your project'
      this.statusBarItem.command = 'vibepilot.stopSession'
    } else {
      this.statusBarItem.text = '$(robot) VibePilot Inactive'
      this.statusBarItem.color = '#999999'
      this.statusBarItem.tooltip = 'Click to start VibePilot session'
      this.statusBarItem.command = 'vibepilot.startSession'
    }
    this.statusBarItem.show()
  }

  private getDashboardHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: #1e1e1e;
            color: #fff;
          }
          .status { 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 5px; 
            background: #333;
          }
          .active { background: #2d5a27; }
          .inactive { background: #5a2727; }
        </style>
      </head>
      <body>
        <h1>🤖 VibePilot Dashboard</h1>
        <div class="status ${this.sessionActive ? 'active' : 'inactive'}">
          Status: ${this.sessionActive ? 'Active' : 'Inactive'}
        </div>
        <p>AI Assistant: ${this.config.aiAssistant}</p>
        <p>Auto Monitoring: ${this.config.autoMonitoring ? 'Enabled' : 'Disabled'}</p>
        <p>For full dashboard, visit: <a href="${this.config.apiUrl}" target="_blank">${this.config.apiUrl}</a></p>
      </body>
      </html>
    `
  }

  dispose() {
    this.statusBarItem.dispose()
    this.outputChannel.dispose()
    if (this.fileWatcher) {
      this.fileWatcher.close()
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  const vibePilot = new VibePilotExtension(context)

  // Register commands
  const commands = [
    vscode.commands.registerCommand('vibepilot.startSession', () => vibePilot.startSession()),
    vscode.commands.registerCommand('vibepilot.stopSession', () => vibePilot.stopSession()),
    vscode.commands.registerCommand('vibepilot.sendPrompt', () => vibePilot.sendCustomPrompt()),
    vscode.commands.registerCommand('vibepilot.openDashboard', () => vibePilot.openDashboard()),
    vscode.commands.registerCommand('vibepilot.autoFix', () => vibePilot.autoFixErrors())
  ]

  commands.forEach(command => context.subscriptions.push(command))
  context.subscriptions.push(vibePilot)

  // Set initial context
  vscode.commands.executeCommand('setContext', 'vibepilot.enabled', true)
  vscode.commands.executeCommand('setContext', 'vibepilot.sessionActive', false)
}

export function deactivate() {
  // Extension cleanup
} 