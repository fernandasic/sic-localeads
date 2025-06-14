
-- Criar tabela para armazenar listas salvas
CREATE TABLE public.saved_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  search_params JSONB NOT NULL,
  companies JSONB NOT NULL
);

-- Habilitar RLS na tabela saved_lists
ALTER TABLE public.saved_lists ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias listas
CREATE POLICY "Users can view their own saved lists" 
  ON public.saved_lists 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias listas
CREATE POLICY "Users can create their own saved lists" 
  ON public.saved_lists 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias listas
CREATE POLICY "Users can delete their own saved lists" 
  ON public.saved_lists 
  FOR DELETE 
  USING (auth.uid() = user_id);
