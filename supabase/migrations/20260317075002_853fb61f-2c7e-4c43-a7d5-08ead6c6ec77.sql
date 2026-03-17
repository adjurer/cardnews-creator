
-- Create the update function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Card news templates table
CREATE TABLE public.card_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  theme_preset TEXT NOT NULL DEFAULT 'cyan-accent',
  source_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.card_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates" ON public.card_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own templates" ON public.card_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.card_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.card_templates FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_card_templates_updated_at
BEFORE UPDATE ON public.card_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
