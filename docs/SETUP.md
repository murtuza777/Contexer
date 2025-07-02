# VibePilot Setup Guide

## 🚀 Quick Start

### 1. Environment Variables
Create a `.env.local` file in the root directory:

```bash
# Required for basic functionality
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional for enhanced AI features  
OPENAI_API_KEY=your_openai_api_key
```

### 2. Database Setup
Run the Supabase schema:
```sql
-- Copy and paste the contents of supabase-schema.sql into your Supabase SQL editor
```

### 3. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 4. Run Development Server
```bash
npm run dev
# or
pnpm dev
```

## 🎯 Core Features Available

### ✅ Working Now (No API Key Required):
- **Project Creation** - Multi-step wizard with templates
- **Smart Build Plan Generation** - Rule-based task breakdown
- **Live Dashboard Interface** - Real-time UI (simulated)
- **Progress Tracking** - Visual build progress
- **File Viewer** - Live code generation preview

### 🔄 Enhanced with API Keys:
- **Real AI Build Plan Generation** - GPT-4 powered planning
- **Intelligent Error Detection** - AI-powered debugging
- **Advanced Code Generation** - AI code writing
- **Smart Feature Detection** - AI requirement analysis

## 🧪 Testing VibePilot

1. **Start the app:** `npm run dev`
2. **Create an account** (if Supabase is configured)
3. **Create a new project** using templates or manual setup
4. **Click "Start AI Build"** to see VibePilot in action
5. **Watch the live dashboard** as it simulates autonomous building

## 🛠️ Development Architecture

```
VibePilot/
├── app/
│   ├── api/ai/           # AI agent endpoints
│   │   ├── route.ts      # Main AI controller
│   │   ├── generate-plan/# Build plan generation
│   │   └── start-build/  # Build session starter
│   └── page.tsx          # Landing page
├── components/
│   ├── CreateProject.tsx # Enhanced project wizard
│   ├── Dashboard.tsx     # Main control center  
│   └── VibePilotDashboard.tsx # Live build interface
├── lib/
│   ├── ai-agent.ts       # Core AI logic
│   └── supabase.ts       # Database client
└── docs/
    └── SETUP.md          # This file
```

## 🔧 API Endpoints

- `POST /api/ai/generate-plan` - Generate build tasks
- `POST /api/ai/start-build` - Start autonomous build
- `POST /api/ai` - Main AI agent controller

## 📊 Database Schema

Key tables:
- `projects` - User projects with build progress
- `ai_sessions` - Active build sessions
- `prompts` - AI interaction logs  
- `project_files` - Generated code files
- `error_logs` - Build errors and fixes

---

**Need help?** The VibePilot MVP is functional without any API keys for testing the core autonomous build experience! 