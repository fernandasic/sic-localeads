
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Send, Clock, CheckCircle, XCircle } from 'lucide-react';

interface BulkSenderProps {
  selectedContacts: any[];
  message: string;
  instanceId: string | null;
}

const BulkSender = ({ selectedContacts, message, instanceId }: BulkSenderProps) => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const startBulkSending = async () => {
    if (!instanceId || selectedContacts.length === 0 || !message.trim()) {
      toast({
        title: "Erro",
        description: "Verifique se há uma instância conectada, contatos selecionados e mensagem preenchida.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setProgress(0);
    setResults([]);
    setShowResults(false);

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        body: {
          action: 'send-bulk',
          instanceId,
          contacts: selectedContacts,
          message
        }
      });

      if (error) {
        throw error;
      }

      setResults(data.results);
      setProgress(100);
      setShowResults(true);

      toast({
        title: "Envio Concluído",
        description: `${data.totalSent} mensagens enviadas com sucesso, ${data.totalFailed} falharam.`,
      });

    } catch (err: any) {
      toast({
        title: "Erro no Envio",
        description: "Erro ao enviar mensagens: " + String(err.message || err),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendToN8n = async () => {
    if (!instanceId || selectedContacts.length === 0 || !message.trim()) {
      toast({
        title: "Erro",
        description: "Verifique se há dados suficientes para enviar ao n8n.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        body: {
          action: 'send-to-n8n',
          instanceId,
          contacts: selectedContacts,
          message
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Dados enviados para n8n com sucesso!",
      });

    } catch (err: any) {
      toast({
        title: "Erro",
        description: "Erro ao enviar para n8n: " + String(err.message || err),
        variant: "destructive",
      });
    }
  };

  const getResultIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  if (!instanceId) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Conecte seu WhatsApp</h3>
          <p className="text-gray-600">
            Primeiro conecte uma instância do WhatsApp para poder enviar mensagens.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (selectedContacts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Send className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Selecione Contatos</h3>
          <p className="text-gray-600">
            Selecione contatos na aba "Contatos" para poder enviar mensagens.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!message.trim()) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Send className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Componha uma Mensagem</h3>
          <p className="text-gray-600">
            Escreva sua mensagem na aba "Mensagem" antes de enviar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Campanha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Contatos selecionados</p>
              <p className="text-2xl font-bold">{selectedContacts.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Caracteres da mensagem</p>
              <p className="text-2xl font-bold">{message.length}</p>
            </div>
          </div>

          {isSending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando mensagens...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={startBulkSending}
              disabled={isSending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Agora
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={sendToN8n}
              disabled={isSending}
            >
              Enviar via N8N
            </Button>
          </div>
        </CardContent>
      </Card>

      {showResults && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados do Envio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {getResultIcon(result.success)}
                    <div>
                      <p className="font-medium text-sm">{result.contact.name}</p>
                      <p className="text-xs text-gray-600">{result.contact.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? 'Enviado' : 'Falhou'}
                    </Badge>
                    {result.error && (
                      <p className="text-xs text-red-600 mt-1">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkSender;
