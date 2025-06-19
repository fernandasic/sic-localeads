
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { QrCode, Smartphone, CheckCircle, RefreshCw } from 'lucide-react';

const QRCodeManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<'pending' | 'connected' | 'disconnected'>('pending');
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkExistingInstance();
    }
  }, [user]);

  const checkExistingInstance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'connected')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao verificar instância:', error);
        return;
      }

      if (data && data.length > 0) {
        const instance = data[0];
        setInstanceId(instance.instance_id);
        setInstanceStatus(instance.status);
        setPhoneNumber(instance.phone_number);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
    }
  };

  const generateQRCode = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        body: { action: 'create-instance' }
      });
      
      if (error) {
        throw error;
      }

      if (data.success) {
        setInstanceId(data.instance.instance_id);
        
        // Buscar QR Code da instância
        await fetchQRCode(data.instance.instance_id);
        
        toast({
          title: "Sucesso",
          description: "Instância criada! Escaneie o QR Code com seu WhatsApp.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: "Erro ao gerar instância: " + String(err.message || err),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchQRCode = async (instId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        body: { action: 'get-qrcode', instanceId: instId }
      });

      if (error) {
        throw error;
      }

      if (data.qrCode) {
        setQrCode(data.qrCode);
        // Monitorar status da conexão
        startStatusMonitoring(instId);
      }
    } catch (err) {
      console.error('Erro ao buscar QR Code:', err);
    }
  };

  const startStatusMonitoring = (instId: string) => {
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
          body: { action: 'check-status', instanceId: instId }
        });

        if (error) {
          clearInterval(interval);
          return;
        }

        if (data.status === 'connected') {
          setInstanceStatus('connected');
          setPhoneNumber(data.phoneNumber);
          setQrCode(null);
          clearInterval(interval);
          
          toast({
            title: "Conectado!",
            description: `WhatsApp conectado com sucesso: ${data.phoneNumber}`,
          });
        } else if (data.status === 'disconnected') {
          setInstanceStatus('disconnected');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err);
        clearInterval(interval);
      }
    }, 3000);

    // Limpar intervalo após 5 minutos
    setTimeout(() => clearInterval(interval), 300000);
  };

  const reconnectInstance = async () => {
    if (!instanceId) return;
    
    setIsGenerating(true);
    try {
      await fetchQRCode(instanceId);
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao reconectar instância",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="text-center space-y-4">
      {instanceStatus === 'connected' ? (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-green-600 font-semibold">WhatsApp Conectado!</p>
            {phoneNumber && (
              <p className="text-sm text-gray-600">{phoneNumber}</p>
            )}
          </div>
          
          <Button 
            variant="outline" 
            onClick={reconnectInstance}
            disabled={isGenerating}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reconectar
          </Button>
        </div>
      ) : !qrCode ? (
        <div className="space-y-4">
          <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">QR Code aparecerá aqui</p>
            </div>
          </div>
          
          <Button 
            onClick={generateQRCode} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gerando...
              </>
            ) : (
              <>
                <Smartphone className="mr-2 h-4 w-4" />
                Conectar WhatsApp
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-48 h-48 mx-auto bg-white border rounded-lg p-4">
            <img src={qrCode} alt="QR Code" className="w-full h-full object-contain" />
          </div>
          
          <div className="text-center space-y-2">
            <div className="animate-pulse">
              <div className="h-2 w-2 bg-blue-500 rounded-full mx-auto mb-2"></div>
            </div>
            <p className="text-blue-600 text-sm">
              Escaneie o QR Code com seu WhatsApp
            </p>
            <p className="text-xs text-gray-500">
              1. Abra o WhatsApp no seu telefone<br/>
              2. Toque em ⋮ &gt; Dispositivos conectados<br/>
              3. Toque em "Conectar um dispositivo"<br/>
              4. Escaneie este código
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeManager;
