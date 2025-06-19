
-- Criar tabela para armazenar instâncias do WhatsApp
CREATE TABLE public.whatsapp_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  instance_id TEXT NOT NULL UNIQUE,
  api_key TEXT,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'disconnected')),
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela whatsapp_instances
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias instâncias
CREATE POLICY "Users can view their own whatsapp instances" 
  ON public.whatsapp_instances 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias instâncias
CREATE POLICY "Users can create their own whatsapp instances" 
  ON public.whatsapp_instances 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias instâncias
CREATE POLICY "Users can update their own whatsapp instances" 
  ON public.whatsapp_instances 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias instâncias
CREATE POLICY "Users can delete their own whatsapp instances" 
  ON public.whatsapp_instances 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_whatsapp_instances_updated_at 
  BEFORE UPDATE ON public.whatsapp_instances 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
