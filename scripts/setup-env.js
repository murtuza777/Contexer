#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔧 Contexer Environment Setup\n')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
const envExists = fs.existsSync(envPath)

if (!envExists) {
  console.log('⚠️  No .env.local file found. Creating one...')
  
  const envContent = `# Contexer Environment Configuration

# Redis Configuration (Upstash Cloud Redis)
REDIS_URL=redis://default:AXSPAAIjcDE5YjFiNGI1ZmY0NzE0Y2Y5YmZjZjk0ODk4MmFmZjlhNXAxMA@supreme-elephant-29839.upstash.io:6379

# Supabase Configuration (Optional - leave as is for Redis-only development)
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_anon_key
SUPABASE_SERVICE_ROLE_KEY=placeholder_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# AI Configuration (for future use)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Docker Configuration
DOCKER_HOST=unix:///var/run/docker.sock

# Development Configuration
PORT=3000
HOSTNAME=localhost
`

  fs.writeFileSync(envPath, envContent)
  console.log('✅ Created .env.local with your Redis URL')
} else {
  console.log('✅ .env.local file exists')
  
  // Check if REDIS_URL is configured
  const envContent = fs.readFileSync(envPath, 'utf8')
  if (!envContent.includes('REDIS_URL=')) {
    console.log('⚠️  Adding REDIS_URL to existing .env.local...')
    const redisLine = '\n# Redis Configuration (Upstash Cloud Redis)\nREDIS_URL=redis://default:AXSPAAIjcDE5YjFiNGI1ZmY0NzE0Y2Y5YmZjZjk0ODk4MmFmZjlhNXAxMA@supreme-elephant-29839.upstash.io:6379\n'
    fs.appendFileSync(envPath, redisLine)
    console.log('✅ Added REDIS_URL to .env.local')
  } else {
    console.log('✅ REDIS_URL already configured')
  }
}

console.log('\n📋 Next Steps:')
console.log('1. Update Supabase URLs in .env.local if needed')
console.log('2. Run: npm run dev')
console.log('3. Test Redis: http://localhost:3000/api/test-redis')
console.log('4. Check Socket.io: http://localhost:3000/api/socket')

console.log('\n🚀 Environment setup complete!') 