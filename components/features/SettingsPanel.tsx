"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  Settings, 
  User, 
  Code2, 
  Bell, 
  Shield, 
  Palette, 
  Download,
  ExternalLink,
  Check,
  Eye,
  Moon,
  Sun,
  Volume2,
  Zap,
  Github,
  Chrome,
  Monitor,
  Save,
  CheckCircle2
} from 'lucide-react'

export default function SettingsPanel() {
  const { toast } = useToast()
  const profileUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: true,
    darkMode: false,
    autonomousMode: true,
    aiAggressiveness: [3],
    soundEffects: true,
    autoFix: true,
    visualObserver: true,
    theme: 'light'
  })

  const [userProfile, setUserProfile] = useState({
    name: 'Michael Murphy',
    email: 'mdmur@example.com',
    avatar: '/placeholder-user.jpg',
    plan: 'Pro',
    joinDate: 'January 2024',
    projectsCreated: 12,
    hoursBuilding: 85
  })

  const [isLoading, setIsLoading] = useState(false)

  const editorExtensions = [
    {
      name: 'Cursor',
      description: 'AI-powered code editor with intelligent suggestions',
      icon: <Code2 className="w-6 h-6" />,
      status: 'installed',
      version: '1.2.3',
      lastUsed: '2 hours ago'
    },
    {
      name: 'VS Code',
      description: 'Visual Studio Code extension for VibePilot',
      icon: <Monitor className="w-6 h-6" />,
      status: 'available',
      version: '2.1.0',
      lastUsed: 'Never'
    },
    {
      name: 'Windsurf',
      description: 'Advanced AI coding assistant integration',
      icon: <Zap className="w-6 h-6" />,
      status: 'available',
      version: '1.0.5',
      lastUsed: 'Never'
    }
  ]

  // Realtime setting updates
  const updateSetting = async (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    
    // Simulate API call
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      toast({
        title: "Setting Updated",
        description: `${key} has been updated successfully.`,
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Realtime profile updates
  const updateProfile = async (key: string, value: string) => {
    setUserProfile(prev => ({ ...prev, [key]: value }))
    
    // Debounce API calls
    if (profileUpdateTimeoutRef.current) {
      clearTimeout(profileUpdateTimeoutRef.current)
    }
    profileUpdateTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        toast({
          title: "Profile Updated",
          description: `Your ${key} has been updated.`,
          duration: 2000,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }, 1000)
  }

  const installExtension = async (extensionName: string) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast({
        title: "Extension Installed",
        description: `${extensionName} has been installed successfully.`,
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: "Installation Failed",
        description: "Failed to install extension. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full bg-white overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-navy-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">Settings</h1>
                <p className="text-gray-600">Customize your VibePilot experience</p>
              </div>
            </div>
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-navy-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Syncing...</span>
              </div>
            )}
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>AI Settings</span>
              </TabsTrigger>
              <TabsTrigger value="extensions" className="flex items-center space-x-2">
                <Code2 className="w-4 h-4" />
                <span>Extensions</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-black flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>User Profile</span>
                    <Badge className="bg-green-100 text-green-700">Live</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={userProfile.avatar} />
                      <AvatarFallback className="bg-navy-100 text-navy-600 text-lg font-semibold">
                        {userProfile.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Button variant="outline" className="w-fit">
                        <Download className="w-4 h-4 mr-2" />
                        Change Avatar
                      </Button>
                      <p className="text-sm text-gray-600">JPG, PNG or GIF (max. 2MB)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-black font-medium">Full Name</Label>
                      <Input
                        id="name"
                        value={userProfile.name}
                        onChange={(e) => updateProfile('name', e.target.value)}
                        className="border-gray-300 focus:border-navy-500 focus:ring-navy-500/20 text-black bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-black font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userProfile.email}
                        onChange={(e) => updateProfile('email', e.target.value)}
                        className="border-gray-300 focus:border-navy-500 focus:ring-navy-500/20 text-black bg-white"
                      />
                    </div>
                  </div>

                  {/* Account Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-navy-50 rounded-lg border border-navy-200">
                      <div className="text-2xl font-bold text-navy-600">{userProfile.projectsCreated}</div>
                      <div className="text-sm text-gray-600">Projects Created</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{userProfile.hoursBuilding}h</div>
                      <div className="text-sm text-gray-600">Building Time</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{userProfile.joinDate}</div>
                      <div className="text-sm text-gray-600">Member Since</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-navy-50 rounded-lg border border-navy-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-navy-600 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-black">Current Plan</h4>
                        <p className="text-sm text-gray-600">Access to all AI features & unlimited projects</p>
                      </div>
                    </div>
                    <Badge className="bg-navy-600 hover:bg-navy-700 text-white">
                      {userProfile.plan}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-black flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>General Settings</span>
                    <Badge className="bg-blue-100 text-blue-700">Realtime</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6">
                    {/* Theme Selection */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-black font-medium">Theme</Label>
                        <p className="text-sm text-gray-600">Choose your preferred interface theme</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={settings.theme === 'light' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateSetting('theme', 'light')}
                          className={settings.theme === 'light' ? 'bg-navy-600 hover:bg-navy-700' : ''}
                        >
                          <Sun className="w-4 h-4 mr-2" />
                          Light
                        </Button>
                        <Button
                          variant={settings.theme === 'dark' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateSetting('theme', 'dark')}
                          className={settings.theme === 'dark' ? 'bg-navy-600 hover:bg-navy-700' : ''}
                        >
                          <Moon className="w-4 h-4 mr-2" />
                          Dark
                        </Button>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-black font-medium">Notifications</Label>
                        <p className="text-sm text-gray-600">Get notified about important updates</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={settings.notifications}
                          onCheckedChange={(checked) => updateSetting('notifications', checked)}
                        />
                        {settings.notifications && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>

                    {/* Auto Save */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-black font-medium">Auto Save</Label>
                        <p className="text-sm text-gray-600">Automatically save your progress</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={settings.autoSave}
                          onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                        />
                        {settings.autoSave && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>

                    {/* Sound Effects */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-black font-medium">Sound Effects</Label>
                        <p className="text-sm text-gray-600">Play sounds for interactions</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={settings.soundEffects}
                          onCheckedChange={(checked) => updateSetting('soundEffects', checked)}
                        />
                        {settings.soundEffects && <Volume2 className="w-4 h-4 text-blue-500" />}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Settings Tab */}
            <TabsContent value="ai" className="space-y-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-black flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>AI Configuration</span>
                    <Badge className="bg-purple-100 text-purple-700">Live Updates</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Autonomous Mode */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-black font-medium">Autonomous Mode</Label>
                      <p className="text-sm text-gray-600">Allow AI to work independently</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.autonomousMode}
                        onCheckedChange={(checked) => updateSetting('autonomousMode', checked)}
                      />
                      {settings.autonomousMode && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                  </div>

                  {/* Auto Fix */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-black font-medium">Auto Fix Errors</Label>
                      <p className="text-sm text-gray-600">Automatically fix detected issues</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.autoFix}
                        onCheckedChange={(checked) => updateSetting('autoFix', checked)}
                      />
                      {settings.autoFix && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                  </div>

                  {/* Visual Observer */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-black font-medium">Visual Observer</Label>
                      <p className="text-sm text-gray-600">Monitor website behavior automatically</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.visualObserver}
                        onCheckedChange={(checked) => updateSetting('visualObserver', checked)}
                      />
                      {settings.visualObserver && <Eye className="w-4 h-4 text-blue-500" />}
                    </div>
                  </div>

                  {/* AI Aggressiveness */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-black font-medium">AI Aggressiveness</Label>
                      <p className="text-sm text-gray-600">How proactive should the AI be? (1 = Conservative, 5 = Very Aggressive)</p>
                    </div>
                    <div className="space-y-2">
                      <Slider
                        value={settings.aiAggressiveness}
                        onValueChange={(value) => updateSetting('aiAggressiveness', value)}
                        max={5}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Conservative</span>
                        <span>Balanced</span>
                        <span>Aggressive</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-navy-600 font-medium">
                        Current: {settings.aiAggressiveness[0] === 1 ? 'Very Conservative' :
                                 settings.aiAggressiveness[0] === 2 ? 'Conservative' :
                                 settings.aiAggressiveness[0] === 3 ? 'Balanced' :
                                 settings.aiAggressiveness[0] === 4 ? 'Aggressive' : 'Very Aggressive'}
                      </p>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Extensions Tab */}
            <TabsContent value="extensions" className="space-y-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-black flex items-center space-x-2">
                    <Code2 className="w-5 h-5" />
                    <span>Editor Extensions</span>
                    <Badge className="bg-orange-100 text-orange-700">1 Active</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {editorExtensions.map((extension) => (
                      <div key={extension.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-navy-300 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-navy-100 to-blue-100 rounded-lg flex items-center justify-center text-navy-600">
                            {extension.icon}
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-medium text-black">{extension.name}</h4>
                            <p className="text-sm text-gray-600">{extension.description}</p>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span>Version {extension.version}</span>
                              <span>•</span>
                              <span>Last used: {extension.lastUsed}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {extension.status === 'installed' ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                              <Check className="w-3 h-3 mr-1" />
                              Installed
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              className="bg-navy-600 hover:bg-navy-700 text-white"
                              onClick={() => installExtension(extension.name)}
                              disabled={isLoading}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Install
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 