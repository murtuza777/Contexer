-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'paused', 'building', 'error')) DEFAULT 'active',
  project_type TEXT CHECK (project_type IN ('web', 'mobile', 'api', 'desktop', 'ai', 'other')) DEFAULT 'web',
  tech_stack TEXT[], -- Array of technologies
  repository_url TEXT,
  local_path TEXT,
  ai_assistant TEXT CHECK (ai_assistant IN ('cursor', 'copilot', 'windsurf', 'codeium', 'tabnine')) DEFAULT 'cursor',
  build_progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_sessions table
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_type TEXT CHECK (session_type IN ('build', 'debug', 'optimize', 'test', 'deploy')) DEFAULT 'build',
  status TEXT CHECK (status IN ('active', 'completed', 'paused', 'error', 'cancelled')) DEFAULT 'active',
  ai_assistant TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  total_prompts INTEGER DEFAULT 0,
  successful_prompts INTEGER DEFAULT 0,
  errors_fixed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.ai_sessions(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_type TEXT CHECK (prompt_type IN ('generate', 'fix', 'optimize', 'test', 'debug', 'custom')) DEFAULT 'generate',
  prompt_text TEXT NOT NULL,
  context_data JSONB, -- Store file contents, error messages, etc.
  ai_response TEXT,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  files_modified TEXT[], -- Array of file paths that were modified
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_files table
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  content TEXT,
  size_bytes INTEGER,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, file_path)
);

-- Create error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.ai_sessions(id) ON DELETE CASCADE,
  error_type TEXT CHECK (error_type IN ('syntax', 'runtime', 'build', 'test', 'dependency', 'other')) DEFAULT 'other',
  error_message TEXT NOT NULL,
  file_path TEXT,
  line_number INTEGER,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  resolved BOOLEAN DEFAULT false,
  resolution_prompt_id UUID REFERENCES public.prompts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for projects
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for ai_sessions
CREATE POLICY "Users can view own ai_sessions" ON public.ai_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ai_sessions" ON public.ai_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_sessions" ON public.ai_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for prompts
CREATE POLICY "Users can view own prompts" ON public.prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prompts" ON public.prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for project_files
CREATE POLICY "Users can view own project_files" ON public.project_files
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id));

CREATE POLICY "Users can manage own project_files" ON public.project_files
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id));

-- Create policies for error_logs
CREATE POLICY "Users can view own error_logs" ON public.error_logs
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id));

CREATE POLICY "Users can create own error_logs" ON public.error_logs
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.projects WHERE id = project_id));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER ai_sessions_updated_at
  BEFORE UPDATE ON public.ai_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update project progress
CREATE OR REPLACE FUNCTION public.update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update project progress based on successful prompts
  UPDATE public.projects 
  SET build_progress = LEAST(100, (
    SELECT COUNT(*) * 10 
    FROM public.prompts 
    WHERE project_id = NEW.project_id AND success = true
  ))
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update project progress when prompts are successful
CREATE TRIGGER update_progress_on_prompt_success
  AFTER INSERT OR UPDATE ON public.prompts
  FOR EACH ROW 
  WHEN (NEW.success = true)
  EXECUTE FUNCTION public.update_project_progress();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects(status);
CREATE INDEX IF NOT EXISTS ai_sessions_project_id_idx ON public.ai_sessions(project_id);
CREATE INDEX IF NOT EXISTS ai_sessions_status_idx ON public.ai_sessions(status);
CREATE INDEX IF NOT EXISTS prompts_session_id_idx ON public.prompts(session_id);
CREATE INDEX IF NOT EXISTS prompts_project_id_idx ON public.prompts(project_id);
CREATE INDEX IF NOT EXISTS prompts_success_idx ON public.prompts(success);
CREATE INDEX IF NOT EXISTS project_files_project_id_idx ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS error_logs_project_id_idx ON public.error_logs(project_id);
CREATE INDEX IF NOT EXISTS error_logs_resolved_idx ON public.error_logs(resolved); 