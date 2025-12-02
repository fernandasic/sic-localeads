import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Eye, EyeOff } from 'lucide-react';

export const EvolutionApiSettings = () => {
  const { user } = useAuth();
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, [user]);

  const loadCredentials = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_evolution_credentials')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setApiUrl(data.api_url);
        setApiKey(data.api_key);
        setHasCredentials(true);
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
    }
  };

  const saveCredentials = async () => {
    if (!user) return;

    if (!apiUrl || !apiKey) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const credentials = {
        user_id: user.id,
        api_url: apiUrl,
        api_key: apiKey,
      };

      if (hasCredentials) {
        const { error } = await supabase
          .from('user_evolution_credentials')
          .update(credentials)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_evolution_credentials')
          .insert(credentials);

        if (error) throw error;
        setHasCredentials(true);
      }

      toast.success('Credenciais salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar credenciais:', error);
      toast.error('Erro ao salvar credenciais: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da EvolutionAPI</CardTitle>
        <CardDescription>
          Configure suas credenciais da EvolutionAPI para conectar suas instâncias do WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiUrl">URL da API</Label>
          <Input
            id="apiUrl"
            type="url"
            placeholder="https://sua-api.com"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              placeholder="Sua chave de API"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button onClick={saveCredentials} disabled={loading} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {hasCredentials ? 'Atualizar Credenciais' : 'Salvar Credenciais'}
        </Button>
      </CardContent>
    </Card>
  );
};