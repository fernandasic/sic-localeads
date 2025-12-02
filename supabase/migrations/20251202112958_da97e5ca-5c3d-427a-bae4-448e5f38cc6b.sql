-- Criar tabela para armazenar credenciais da EvolutionAPI por usuário
CREATE TABLE public.user_evolution_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_evolution_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - usuário só vê suas próprias credenciais
CREATE POLICY "Usuários podem ver suas próprias credenciais"
  ON public.user_evolution_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias credenciais"
  ON public.user_evolution_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias credenciais"
  ON public.user_evolution_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias credenciais"
  ON public.user_evolution_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- Criar tabela para instâncias do WhatsApp
CREATE TABLE public.whatsapp_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id TEXT NOT NULL,
  phone_number TEXT,
  qr_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, instance_id)
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_instances
CREATE POLICY "Usuários podem ver suas próprias instâncias"
  ON public.whatsapp_instances
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias instâncias"
  ON public.whatsapp_instances
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias instâncias"
  ON public.whatsapp_instances
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias instâncias"
  ON public.whatsapp_instances
  FOR DELETE
  USING (auth.uid() = user_id);

-- Criar tabela para listas salvas (corrigir erros de build)
CREATE TABLE public.saved_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  companies JSONB NOT NULL,
  search_params JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias listas"
  ON public.saved_lists FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias listas"
  ON public.saved_lists FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias listas"
  ON public.saved_lists FOR DELETE USING (auth.uid() = user_id);

-- Criar tabela para mensagens salvas (corrigir erros de build)
CREATE TABLE public.saved_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias mensagens"
  ON public.saved_messages FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias mensagens"
  ON public.saved_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias mensagens"
  ON public.saved_messages FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_evolution_credentials_updated_at
  BEFORE UPDATE ON public.user_evolution_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();