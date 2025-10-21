# Configuração do Login com Google

Este guia explica como configurar o login com Google no seu projeto Supabase.

## Pré-requisitos

- Uma conta no Google Cloud Platform
- Acesso ao dashboard do Supabase

## Passo 1: Configurar no Google Cloud Console

### 1.1 Criar/Selecionar um Projeto

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente

### 1.2 Configurar a Tela de Consentimento

1. Vá para **APIs & Services** > **OAuth consent screen**
2. Escolha **External** como tipo de usuário
3. Preencha as informações obrigatórias:
   - Nome do app
   - Email de suporte do usuário
   - Logo do app (opcional)
   - Domínios autorizados: adicione `zmdocbrbimcfsqmhyopy.supabase.co`
   - Links da política de privacidade e termos de serviço

4. Em **Scopes**, adicione os seguintes escopos:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`

### 1.3 Criar Credenciais OAuth

1. Vá para **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **OAuth Client ID**
3. Escolha **Web application** como tipo de aplicação
4. Configure:

   **Authorized JavaScript origins:**
   ```
   https://zmdocbrbimcfsqmhyopy.supabase.co
   http://localhost:5173
   ```
   (Adicione também o URL do seu site em produção)

   **Authorized redirect URIs:**
   ```
   https://zmdocbrbimcfsqmhyopy.supabase.co/auth/v1/callback
   ```

5. Clique em **Create**
6. Copie o **Client ID** e **Client Secret** gerados

## Passo 2: Configurar no Supabase

### 2.1 Adicionar Credenciais do Google

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard/project/zmdocbrbimcfsqmhyopy/auth/providers)
2. Vá para **Authentication** > **Providers**
3. Encontre **Google** na lista de provedores
4. Ative o provedor Google
5. Cole o **Client ID** e **Client Secret** que você copiou
6. Clique em **Save**

### 2.2 Configurar URLs de Redirecionamento

1. No dashboard do Supabase, vá para **Authentication** > **URL Configuration**
2. Configure:
   
   **Site URL:**
   ```
   https://seu-dominio.com
   ```
   (Use o URL do seu site em produção ou o preview URL)

   **Redirect URLs:**
   ```
   https://seu-dominio.com/**
   http://localhost:5173/**
   ```
   (Adicione todos os URLs onde sua aplicação estará disponível)

## Passo 3: Testar o Login

1. Acesse sua aplicação
2. Clique no botão "Continuar com Google"
3. Selecione sua conta Google
4. Autorize o acesso
5. Você será redirecionado de volta para a aplicação logado

## Problemas Comuns

### Erro: "redirect_uri_mismatch"
- Verifique se o redirect URI no Google Cloud Console está correto
- Deve ser: `https://zmdocbrbimcfsqmhyopy.supabase.co/auth/v1/callback`

### Erro: "access_denied"
- Verifique se os escopos estão configurados corretamente na tela de consentimento
- Certifique-se de que o domínio está autorizado

### Login funciona mas usuário não é criado
- Verifique se o trigger `on_auth_user_created` está ativo no banco de dados
- Verifique os logs do Supabase para erros

## Links Úteis

- [Documentação Supabase - Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Dashboard Supabase - Authentication](https://supabase.com/dashboard/project/zmdocbrbimcfsqmhyopy/auth/providers)

## Desabilitar Confirmação de Email (Desenvolvimento)

Para agilizar o teste durante o desenvolvimento:

1. Acesse **Authentication** > **Providers** > **Email**
2. Desmarque a opção **Confirm email**
3. Clique em **Save**

⚠️ **IMPORTANTE**: Em produção, sempre mantenha a confirmação de email ativada!
