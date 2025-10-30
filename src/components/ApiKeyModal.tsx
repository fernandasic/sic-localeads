import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from '@/hooks/use-toast';
import { ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

const ApiKeyModal = ({ isOpen, onClose, onSave }: ApiKeyModalProps) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('googleMapsApiKey');
      if (savedKey) {
        setApiKey(savedKey);
      }
    }
  }, [isOpen]);

  const validateApiKey = (key: string): boolean => {
    // Chaves do Google Maps geralmente começam com "AIza"
    if (key.startsWith('sk-') || key.startsWith('sk_')) {
      toast({
        title: 'Chave Inválida',
        description: 'Esta parece ser uma chave da OpenAI. Você precisa de uma chave da Google Maps API.',
        variant: 'destructive',
      });
      return false;
    }
    
    if (key.length < 20) {
      toast({
        title: 'Chave Inválida',
        description: 'A chave da API do Google Maps deve ter pelo menos 20 caracteres.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSave = () => {
    const trimmedKey = apiKey.trim();
    
    if (trimmedKey === '') {
      toast({
        title: 'Erro',
        description: 'Por favor, insira uma chave de API válida.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateApiKey(trimmedKey)) {
      return;
    }

    onSave(trimmedKey);
    toast({
      title: 'Sucesso!',
      description: 'Chave de API salva com sucesso.',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar Google Maps API Key</DialogTitle>
          <DialogDescription>
            Para usar a busca de empresas, você precisa de uma chave da Google Maps Places API.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key do Google Maps</Label>
            <Input
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              ⚠️ Não use chaves de outros serviços (OpenAI, etc.). Precisa ser do Google Maps.
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              📝 Como obter sua chave:
            </h4>
            <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Acesse o Google Cloud Console</li>
              <li>Crie ou selecione um projeto</li>
              <li>Ative a "Places API"</li>
              <li>Crie uma credencial (API Key)</li>
              <li>Cole a chave aqui</li>
            </ol>
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              Abrir Google Cloud Console
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Chave</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyModal;
