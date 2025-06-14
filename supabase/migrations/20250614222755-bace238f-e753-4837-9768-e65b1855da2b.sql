
-- Cria a tabela para armazenar as empresas cadastradas manualmente
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  instagram TEXT,
  whatsapp TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilita a Segurança em Nível de Linha (RLS) para a tabela
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Cria uma política para permitir que qualquer pessoa veja as empresas cadastradas
CREATE POLICY "Allow public read access to companies"
  ON public.companies
  FOR SELECT
  USING (true);

-- Cria uma política para permitir que qualquer pessoa cadastre uma nova empresa
CREATE POLICY "Allow public insert access to companies"
  ON public.companies
  FOR INSERT
  WITH CHECK (true);
