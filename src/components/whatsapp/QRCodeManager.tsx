
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Smartphone, CheckCircle } from 'lucide-react';

const QRCodeManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [instanceName, setInstanceName] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<'pending' | 'connected' | 'disconnected'>('pending');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  const generateQRCode = async () => {
    if (!user || !instanceName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome para a instância",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Enviando dados para webhook:', {
        instanceName: instanceName.trim(),
        userId: user.id,
        userEmail: user.email
      });

      // Enviar dados para o webhook n8n
      const webhookResponse = await fetch('https://webhookn8nsic.agentessic.com/webhook/qrcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: instanceName.trim(),
          userId: user.id,
          userEmail: user.email
        })
      });

      console.log('Status da resposta do webhook:', webhookResponse.status);

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('Erro do webhook:', errorText);
        throw new Error(`Erro ${webhookResponse.status}: ${errorText}`);
      }

      const webhookData = await webhookResponse.json();
      console.log('Resposta do webhook:', webhookData);
      
      if (webhookData.qrCode || webhookData.qrcode) {
        const qrCodeData = webhookData.qrCode || webhookData.qrcode;
        setQrCode(qrCodeData);
        
        // Salvar instância no banco de dados
        try {
          const { error: dbError } = await supabase
            .from('whatsapp_instances' as any)
            .insert({
              user_id: user.id,
              instance_id: instanceName.trim(),
              status: 'pending',
              qr_code: qrCodeData
            });

          if (dbError) {
            console.error('Erro ao salvar no banco:', dbError);
          }
        } catch (dbErr) {
          console.error('Erro na operação do banco:', dbErr);
        }

        toast({
          title: "Sucesso",
          description: "QR Code gerado! Escaneie com seu WhatsApp.",
        });
      } else {
        console.error('QR Code não encontrado na resposta:', webhookData);
        throw new Error('QR Code não retornado pelo webhook');
      }
    } catch (err: any) {
      console.error('Erro completo:', err);
      toast({
        title: "Erro",
        description: `Erro ao gerar QR Code: ${err.message || 'Erro desconhecido'}`,
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
        </div>
      ) : !qrCode ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instanceName">Nome da Instância</Label>
            <Input
              id="instanceName"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="Digite o nome da instância"
              className="w-full"
            />
          </div>
          
          <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">QR Code aparecerá aqui</p>
            </div>
          </div>
          
          <Button 
            onClick={generateQRCode} 
            disabled={isGenerating || !instanceName.trim()}
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
