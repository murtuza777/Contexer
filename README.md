# 🤖 VibePilot - AI Vibe Coding Assistant

> **The first Meta-AI Assistant that controls other AI coding assistants to build projects autonomously**

VibePilot is a revolutionary platform that acts as a higher-level AI agent to manage and control other AI coding assistants (Cursor, GitHub Copilot, WindSurf, etc.) on your behalf. Sit back, relax, and watch your projects build themselves while you focus on other activities.

![VibePilot Preview](https://img.shields.io/badge/Status-Beta-orange) ![React](https://img.shields.io/badge/React-19.x-blue) ![Next.js](https://img.shields.io/badge/Next.js-15.x-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Supabase](https://img.shields.io/badge/Supabase-Database-green)

## 🚀 Features

### 🧠 **AI Agent Controller**
- **Meta-AI Assistant**: First-of-its-kind AI that controls other AI assistants
- **Multi-AI Support**: Works with Cursor, GitHub Copilot, WindSurf, Codeium, Tabnine
- **Intelligent Orchestration**: Sends contextual prompts and manages responses
- **Error Handling**: Automatic retry mechanisms and fallback strategies

### 📝 **Smart Prompt Generator**  
- **Context-Aware**: Analyzes your project structure and generates optimal prompts
- **Error-Specific**: Creates targeted fix prompts for detected issues
- **Learning System**: Improves prompt quality based on success rates
- **Template Library**: Pre-built prompts for common development tasks

### 👁️ **Real-time Project Monitor**
- **Live Monitoring**: Watches file changes, compilation errors, test results
- **Progress Tracking**: Visual progress indicators and build status
- **Performance Metrics**: Success rates, response times, error counts
- **Activity Logs**: Detailed logs of all AI interactions

### 🔄 **Auto Error Resolution**
- **Syntax Fixing**: Automatically detects and fixes syntax errors
- **Dependency Resolution**: Handles missing imports and package issues
- **Code Optimization**: Suggests and implements performance improvements
- **Test Failure Recovery**: Analyzes and fixes failing tests

### 📊 **Project Dashboard & Analytics**
- **Real-time Status**: Live project monitoring and control interface
- **Analytics**: Detailed metrics on AI performance and project progress
- **Session Management**: Start, stop, and configure AI sessions
- **Team Collaboration**: (Coming soon) Share projects and collaborate

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15.2.4** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **Radix UI** - Accessible primitives

### **Backend & Database**
- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security** - Secure data access
- **Authentication** - Built-in auth with social providers
- **APIs** - RESTful endpoints for AI agent control

### **AI & Automation**
- **OpenAI API** - Advanced language model integration
- **WebSocket** - Real-time communication
- **File Watching** - Automatic change detection
- **Browser Automation** - Extension integration

### **Extensions**
- **VS Code Extension** - Native IDE integration
- **Cross-platform** - Cursor, WindSurf, and more
- **Universal Protocol** - Works with any AI coding assistant

## 🎯 How It Works

### 1. **Project Setup**
```
User → Upload/Create Project → VibePilot Analyzes → Generate Build Plan
```

### 2. **Autonomous Building**  
```
VibePilot → Generate Smart Prompts → Send to AI Assistant → Monitor Progress → Handle Errors → Continue Building
```

### 3. **User Monitoring**
```
User → Watch Live Dashboard → See Real-time Progress → Intervene if Needed → Enjoy Free Time
```

## 🚀 Quick Start

### **1. Clone & Install**
```bash
git clone https://github.com/murtuza777/VibePilot.git
cd vibePilot-v0
npm install
```

### **2. Environment Setup**
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **3. Database Setup**
```bash
# Run the database schema in your Supabase project
# Copy contents of supabase-schema.sql to Supabase SQL Editor
```

### **4. Start Development**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the magic! ✨

### **5. Install VS Code Extension**
```bash
cd extensions/vscode
npm install
npm run compile
# Install in VS Code via Extensions > Install from VSIX
```

## 🎮 Usage

### **Web Dashboard**
1. **Sign up/Login** to your VibePilot account
2. **Create a Project** by clicking "New Project"
3. **Configure** your preferred AI assistant and tech stack  
4. **Start AI Session** to begin autonomous building
5. **Monitor Progress** via the real-time dashboard

### **VS Code Extension**
1. **Install** the VibePilot extension
2. **Open** your project workspace
3. **Run Command**: `VibePilot: Start AI Session`
4. **Watch** as AI builds your project automatically
5. **Intervene** when needed via custom prompts

## 🔧 Configuration

### **AI Assistant Settings**
```json
{
  "aiAssistant": "cursor",           // cursor | copilot | windsurf | codeium | tabnine
  "autoMonitoring": true,            // Enable automatic error detection
  "promptInterval": 5,               // Seconds between automated prompts
  "maxRetries": 3,                   // Max retry attempts for failed prompts
  "successThreshold": 0.8            // Required success rate
}
```

### **Project Types**
- **Web App**: React, Next.js, Vue, Angular
- **Mobile App**: React Native, Flutter
- **API/Backend**: Node.js, Python, Go, Rust
- **Desktop App**: Electron, Tauri
- **AI/ML**: Python, TensorFlow, PyTorch
- **Custom**: Define your own stack

## 📈 Platform Modes

### **🌐 Web App Mode**
- Full-featured dashboard
- Cloud-based processing  
- Project management
- Team collaboration
- Real-time monitoring

### **🧩 Extension Mode**
- Lightweight integration
- Direct IDE control
- Local processing
- Seamless workflow
- Offline capabilities

### **🔄 Hybrid Mode**
- Best of both worlds
- Cloud intelligence + Local execution
- Cross-device sync
- Backup and restore

## 📁 Project Structure

```
vibePilot-v0/
├── app/
│   ├── api/                     # API routes
│   │   ├── ai/                 # AI agent endpoints
│   │   └── projects/           # Project management
│   ├── globals.css             # Global styles with theme support
│   ├── layout.tsx              # Root layout with ThemeProvider
│   └── page.tsx                # Landing page with dashboard integration
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── Dashboard.tsx           # Main dashboard interface
│   ├── CreateProject.tsx       # Project creation modal
│   └── theme-provider.tsx      # Dark theme configuration
├── extensions/
│   └── vscode/                 # VS Code extension
│       ├── src/extension.ts    # Main extension logic
│       ├── package.json        # Extension manifest
│       └── tsconfig.json       # TypeScript config
├── hooks/
│   ├── useAuth.ts              # Authentication hook
│   └── use-toast.ts            # Toast notifications
├── lib/
│   ├── ai-agent.ts             # Core AI agent controller
│   ├── supabase.ts             # Database client
│   └── utils.ts                # Utility functions
├── public/                     # Static assets
├── supabase-schema.sql         # Complete database schema
└── package.json                # Dependencies and scripts
```

## 🎉 Why VibePilot?

### **🥇 First Meta-AI Assistant**
- No other platform controls AI assistants like this
- Revolutionary approach to automated development
- Bridges the gap between AI tools and productivity

### **⏰ True Time Freedom**
- Let AI handle the coding while you focus on strategy
- Perfect for busy developers and entrepreneurs
- Ideal for learning by watching AI work

### **🔌 Universal Integration**
- Works with ANY AI coding assistant
- No vendor lock-in
- Future-proof architecture

### **📚 Continuous Learning**
- Improves with every project
- Learns your coding patterns
- Adapts to your preferences

## 🛣️ Roadmap

### **Phase 1: Foundation** ✅
- ✅ Web app with authentication
- ✅ Database schema and APIs
- ✅ Basic AI agent controller
- ✅ VS Code extension framework
- ✅ Project management system

### **Phase 2: AI Integration** 🚧
- 🔄 Real AI assistant integrations
- 🔄 Advanced prompt generation
- 🔄 Error detection and auto-fixing
- 🔄 Live project monitoring

### **Phase 3: Advanced Features** 🎯
- 🎯 Multi-AI orchestration
- 🎯 Advanced analytics
- 🎯 Machine learning optimization
- 🎯 Cross-platform extensions

### **Phase 4: Enterprise** 🚀
- 🚀 Team collaboration
- 🚀 Enterprise integrations
- 🚀 Custom AI models
- 🚀 Marketplace ecosystem

## 💰 Pricing

### **🆓 Free Tier**
- Up to 3 projects
- Basic AI assistant integration
- Community support
- Limited prompts per month

### **💎 Pro Tier** ($19/month)
- Unlimited projects
- All AI assistants
- Priority support
- Advanced analytics
- Custom prompts

### **🏢 Enterprise** ($99/month)
- Team collaboration
- Custom integrations
- Dedicated support
- On-premise deployment
- SLA guarantees

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 📞 Contact

Murtuza - [@murtuza777](https://github.com/murtuza777)

Project Link: [https://github.com/murtuza777/VibePilot](https://github.com/murtuza777/VibePilot)

## 🔗 Links

- **GitHub**: [VibePilot Repository](https://github.com/murtuza777/VibePilot)
- **Demo**: [Live Demo](https://vibepilot.vercel.app)
- **Documentation**: [Full Documentation](docs/README.md)

---

**Built with ❤️ by the VibePilot Team**

*"The future of coding is autonomous. The future is VibePilot."*

⭐ **Star this repository if you believe in the future of AI-assisted development!** 