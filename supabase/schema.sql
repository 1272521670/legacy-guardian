-- ============================================================
-- 数字遗产守护 - Supabase 数据库 Schema
-- 运行方式：在 Supabase Dashboard -> SQL Editor 中执行
-- ============================================================

-- 1. profiles（用户信息，由 auth.users 触发自动创建）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  date_of_birth TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. wills（遗嘱）
CREATE TABLE IF NOT EXISTS public.wills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. executors（遗产执行人）
CREATE TABLE IF NOT EXISTS public.executors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  is_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. guardians（AI 守护人）
CREATE TABLE IF NOT EXISTS public.guardians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  reminder_days INTEGER DEFAULT 7,
  last_checkin TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. assets（数字资产）
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  platform TEXT NOT NULL,
  account TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. messages（预设消息）
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_email TEXT,
  recipient_name TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  trigger TEXT DEFAULT 'manual',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security（行级安全策略）
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- profiles: 用户只能读写自己的
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- wills: 用户只能读写自己的遗嘱
CREATE POLICY "Users can CRUD own wills" ON public.wills FOR ALL USING (auth.uid() = user_id);

-- executors: 用户只能管理自己的执行人
CREATE POLICY "Users can CRUD own executors" ON public.executors FOR ALL USING (auth.uid() = user_id);

-- guardians: 用户只能管理自己的守护人
CREATE POLICY "Users can CRUD own guardians" ON public.guardians FOR ALL USING (auth.uid() = user_id);

-- assets: 用户只能管理自己的资产
CREATE POLICY "Users can CRUD own assets" ON public.assets FOR ALL USING (auth.uid() = user_id);

-- messages: 用户只能管理自己的消息
CREATE POLICY "Users can CRUD own messages" ON public.messages FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 自动触发器：创建新用户时自动创建 profile
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
