import Docker from 'dockerode'
import { v4 as uuidv4 } from 'uuid'

export interface ProjectEnvironment {
  id: string
  projectId: string
  containerId: string
  containerName: string
  port: number
  status: 'creating' | 'running' | 'stopped' | 'error'
  createdAt: Date
  lastActivity: Date
}

export interface ContainerConfig {
  image: string
  name: string
  port: number
  environment: Record<string, string>
  volumes: string[]
  workingDir: string
  command?: string[]
}

export class DockerEnvironmentManager {
  private docker: Docker
  private environments: Map<string, ProjectEnvironment> = new Map()
  private portRange = { start: 4000, end: 5000 }
  private usedPorts: Set<number> = new Set()

  constructor() {
    this.docker = new Docker({
      socketPath: process.env.DOCKER_HOST || '/var/run/docker.sock'
    })
    
    this.initializeManager()
  }

  private async initializeManager() {
    try {
      // Check Docker connection
      await this.docker.ping()
      console.log('Docker connection established')
      
      // Clean up any orphaned containers
      await this.cleanupOrphanedContainers()
    } catch (error) {
      console.error('Failed to connect to Docker:', error)
      throw new Error('Docker is not available')
    }
  }

  async createProjectEnvironment(projectId: string, config: Partial<ContainerConfig> = {}): Promise<ProjectEnvironment> {
    const environmentId = uuidv4()
    const containerName = `contexer-project-${projectId}-${environmentId.slice(0, 8)}`
    const port = this.getAvailablePort()

    const defaultConfig: ContainerConfig = {
      image: 'node:18-alpine',
      name: containerName,
      port,
      environment: {
        NODE_ENV: 'development',
        PORT: port.toString(),
        PROJECT_ID: projectId,
        ENVIRONMENT_ID: environmentId
      },
      volumes: [
        `contexer-project-${projectId}:/app`,
        '/app/node_modules'
      ],
      workingDir: '/app',
      command: ['sh', '-c', 'tail -f /dev/null'] // Keep container running
    }

    const finalConfig = { ...defaultConfig, ...config }

    try {
      console.log(`Creating environment for project ${projectId}...`)
      
      // Create volume for project if it doesn't exist
      await this.ensureProjectVolume(projectId)
      
      // Create container
      const container = await this.docker.createContainer({
        Image: finalConfig.image,
        name: finalConfig.name,
        Env: Object.entries(finalConfig.environment).map(([key, value]) => `${key}=${value}`),
        WorkingDir: finalConfig.workingDir,
        Cmd: finalConfig.command,
        ExposedPorts: {
          [`${finalConfig.port}/tcp`]: {}
        },
        HostConfig: {
          Binds: finalConfig.volumes,
          NetworkMode: 'contexer-network',
          RestartPolicy: { Name: 'unless-stopped' },
          PortBindings: {
            [`${finalConfig.port}/tcp`]: [{ HostPort: finalConfig.port.toString() }]
          }
        },
        Labels: {
          'contexer.project.id': projectId,
          'contexer.environment.id': environmentId,
          'contexer.type': 'project-environment'
        }
      })

      // Start container
      await container.start()
      
      // Get container info to get the actual ID
      const containerInfo = await container.inspect()
      
      const environment: ProjectEnvironment = {
        id: environmentId,
        projectId,
        containerId: containerInfo.Id,
        containerName: finalConfig.name,
        port: finalConfig.port,
        status: 'running',
        createdAt: new Date(),
        lastActivity: new Date()
      }

      this.environments.set(environmentId, environment)
      this.usedPorts.add(port)

      console.log(`Environment created for project ${projectId}: ${environmentId}`)
      return environment

    } catch (error) {
      console.error(`Failed to create environment for project ${projectId}:`, error)
      throw new Error(`Failed to create project environment: ${error}`)
    }
  }

  async stopProjectEnvironment(environmentId: string): Promise<boolean> {
    const environment = this.environments.get(environmentId)
    if (!environment) {
      console.warn(`Environment not found: ${environmentId}`)
      return false
    }

    try {
      const container = this.docker.getContainer(environment.containerId)
      await container.stop()
      
      environment.status = 'stopped'
      environment.lastActivity = new Date()
      
      console.log(`Environment stopped: ${environmentId}`)
      return true
    } catch (error) {
      console.error(`Failed to stop environment ${environmentId}:`, error)
      return false
    }
  }

  async restartProjectEnvironment(environmentId: string): Promise<boolean> {
    const environment = this.environments.get(environmentId)
    if (!environment) {
      console.warn(`Environment not found: ${environmentId}`)
      return false
    }

    try {
      const container = this.docker.getContainer(environment.containerId)
      await container.restart()
      
      environment.status = 'running'
      environment.lastActivity = new Date()
      
      console.log(`Environment restarted: ${environmentId}`)
      return true
    } catch (error) {
      console.error(`Failed to restart environment ${environmentId}:`, error)
      return false
    }
  }

  async removeProjectEnvironment(environmentId: string): Promise<boolean> {
    const environment = this.environments.get(environmentId)
    if (!environment) {
      console.warn(`Environment not found: ${environmentId}`)
      return false
    }

    try {
      const container = this.docker.getContainer(environment.containerId)
      
      // Stop container if running
      try {
        await container.stop()
      } catch (error) {
        // Container might already be stopped
        console.warn(`Container already stopped: ${environment.containerId}`)
      }
      
      // Remove container
      await container.remove()
      
      // Free up port
      this.usedPorts.delete(environment.port)
      
      // Remove from environments map
      this.environments.delete(environmentId)
      
      console.log(`Environment removed: ${environmentId}`)
      return true
    } catch (error) {
      console.error(`Failed to remove environment ${environmentId}:`, error)
      return false
    }
  }

  async executeCommand(environmentId: string, command: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const environment = this.environments.get(environmentId)
    if (!environment) {
      throw new Error(`Environment not found: ${environmentId}`)
    }

    try {
      const container = this.docker.getContainer(environment.containerId)
      
      const exec = await container.exec({
        Cmd: command,
        AttachStdout: true,
        AttachStderr: true
      })

      const stream = await exec.start({ Detach: false })
      
      return new Promise((resolve, reject) => {
        let stdout = ''
        let stderr = ''

        stream.on('data', (chunk: Buffer) => {
          const str = chunk.toString()
          if (chunk[0] === 1) {
            stdout += str.slice(8) // Remove Docker stream header
          } else if (chunk[0] === 2) {
            stderr += str.slice(8) // Remove Docker stream header
          }
        })

        stream.on('end', async () => {
          try {
            const inspectResult = await exec.inspect()
            resolve({
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode: inspectResult.ExitCode || 0
            })
          } catch (error) {
            reject(error)
          }
        })

        stream.on('error', reject)
      })
    } catch (error) {
      console.error(`Failed to execute command in environment ${environmentId}:`, error)
      throw error
    }
  }

  async getEnvironmentLogs(environmentId: string, tail: number = 100): Promise<string> {
    const environment = this.environments.get(environmentId)
    if (!environment) {
      throw new Error(`Environment not found: ${environmentId}`)
    }

    try {
      const container = this.docker.getContainer(environment.containerId)
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: true
      })

      return logs.toString()
    } catch (error) {
      console.error(`Failed to get logs for environment ${environmentId}:`, error)
      throw error
    }
  }

  async getEnvironmentStatus(environmentId: string): Promise<ProjectEnvironment | null> {
    const environment = this.environments.get(environmentId)
    if (!environment) {
      return null
    }

    try {
      const container = this.docker.getContainer(environment.containerId)
      const containerInfo = await container.inspect()
      
      environment.status = containerInfo.State.Running ? 'running' : 'stopped'
      environment.lastActivity = new Date()
      
      return environment
    } catch (error) {
      console.error(`Failed to get status for environment ${environmentId}:`, error)
      environment.status = 'error'
      return environment
    }
  }

  getProjectEnvironments(projectId: string): ProjectEnvironment[] {
    return Array.from(this.environments.values()).filter(env => env.projectId === projectId)
  }

  getAllEnvironments(): ProjectEnvironment[] {
    return Array.from(this.environments.values())
  }

  private getAvailablePort(): number {
    for (let port = this.portRange.start; port <= this.portRange.end; port++) {
      if (!this.usedPorts.has(port)) {
        return port
      }
    }
    throw new Error('No available ports in range')
  }

  private async ensureProjectVolume(projectId: string): Promise<void> {
    const volumeName = `contexer-project-${projectId}`
    
    try {
      await this.docker.getVolume(volumeName).inspect()
      console.log(`Volume already exists: ${volumeName}`)
    } catch (error) {
      // Volume doesn't exist, create it
      try {
        await this.docker.createVolume({
          Name: volumeName,
          Labels: {
            'contexer.project.id': projectId,
            'contexer.type': 'project-volume'
          }
        })
        console.log(`Volume created: ${volumeName}`)
      } catch (createError) {
        console.error(`Failed to create volume ${volumeName}:`, createError)
        throw createError
      }
    }
  }

  private async cleanupOrphanedContainers(): Promise<void> {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: ['contexer.type=project-environment']
        }
      })

      for (const containerInfo of containers) {
        const container = this.docker.getContainer(containerInfo.Id)
        
        try {
          if (containerInfo.State === 'running') {
            await container.stop()
          }
          await container.remove()
          console.log(`Cleaned up orphaned container: ${containerInfo.Names[0]}`)
        } catch (error) {
          console.warn(`Failed to cleanup container ${containerInfo.Id}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to cleanup orphaned containers:', error)
    }
  }

  async isDockerHealthy(): Promise<boolean> {
    try {
      await this.docker.ping()
      return true
    } catch (error) {
      console.error('Docker health check failed:', error)
      return false
    }
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up Docker Environment Manager...')
    
    // Stop all environments
    const stopPromises = Array.from(this.environments.keys()).map(envId => 
      this.stopProjectEnvironment(envId)
    )
    
    await Promise.allSettled(stopPromises)
    
    this.environments.clear()
    this.usedPorts.clear()
    
    console.log('Docker Environment Manager cleanup complete')
  }
} 