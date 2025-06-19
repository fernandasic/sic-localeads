
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { QrCode, Smartphone, CheckCircle } from 'lucide-react';

const QRCodeManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<'pending' | 'connected' | 'disconnected'>('pending');

  const generateQRCode = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager/create-instance');
      
      if (error) {
        throw error;
      }

      if (data.success) {
        // Simular QR Code - em produção, isso viria da EvolutionAPI
        const mockQR = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
        setQrCode(mockQR);
        
        toast({
          title: "Sucesso",
          description: "QR Code gerado! Escaneie com seu WhatsApp.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: "Erro ao gerar QR Code: " + String(err),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="text-center space-y-4">
      {!qrCode ? (
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
          
          {instanceStatus === 'connected' ? (
            <div className="text-center space-y-2">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
              <p className="text-green-600 font-semibold">WhatsApp Conectado!</p>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="animate-pulse">
                <div className="h-2 w-2 bg-blue-500 rounded-full mx-auto mb-2"></div>
              </div>
              <p className="text-blue-600 text-sm">
                Escaneie o QR Code com seu WhatsApp
              </p>
              <p className="text-xs text-gray-500">
                1. Abra o WhatsApp no seu telefone<br/>
                2. Toque em ⋮ > Dispositivos conectados<br/>
                3. Toque em "Conectar um dispositivo"<br/>
                4. Escaneie este código
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QRCodeManager;
