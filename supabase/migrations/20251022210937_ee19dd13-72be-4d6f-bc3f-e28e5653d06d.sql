-- Criar tabela para listas salvas de contatos
CREATE TABLE IF NOT EXISTS public.saved_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_name TEXT NOT NULL,
  companies JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.saved_companies ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem ver suas próprias listas"
  ON public.saved_companies
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias listas"
  ON public.saved_companies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias listas"
  ON public.saved_companies
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias listas"
  ON public.saved_companies
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_companies_updated_at
  BEFORE UPDATE ON public.saved_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();