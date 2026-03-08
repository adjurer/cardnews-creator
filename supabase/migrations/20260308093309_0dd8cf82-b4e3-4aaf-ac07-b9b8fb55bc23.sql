
-- Instagram accounts table for storing multiple IG accounts per user
CREATE TABLE public.instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ig_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  profile_picture_url TEXT,
  access_token TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ig_user_id)
);

ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own accounts
CREATE POLICY "Users can view own instagram accounts"
ON public.instagram_accounts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own accounts
CREATE POLICY "Users can insert own instagram accounts"
ON public.instagram_accounts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own accounts
CREATE POLICY "Users can update own instagram accounts"
ON public.instagram_accounts FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own accounts
CREATE POLICY "Users can delete own instagram accounts"
ON public.instagram_accounts FOR DELETE TO authenticated
USING (auth.uid() = user_id);
