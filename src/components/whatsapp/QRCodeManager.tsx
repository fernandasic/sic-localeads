import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Smartphone, CheckCircle, RefreshCw } from 'lucide-react';

const QRCodeManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [instanceName, setInstanceName] = useState('');
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<'pending' | 'connected' | 'disconnected'>('pending');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const currentInstanceRef = useRef<string | null>(null);

  // Limpar intervalos quando componente desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Função para processar base64 e garantir que seja uma imagem válida
  const processBase64QRCode = (base64Data: string): string | null => {
    try {
      console.log('Processando base64 QR Code:', base64Data.substring(0, 100) + '...');
      
      let processedBase64 = base64Data;
      
      // Remover possíveis prefixos existentes
      if (processedBase64.startsWith('data:image/')) {
        processedBase64 = processedBase64.split(',')[1];
      }
      
      // Verificar se é um base64 válido
      if (!processedBase64 || processedBase64.length < 100) {
        console.error('Base64 muito curto ou inválido:', processedBase64.length);
        return null;
      }
      
      // Adicionar prefixo correto para imagem
      const finalBase64 = `data:image/png;base64,${processedBase64}`;
      console.log('Base64 processado com sucesso');
      
      return finalBase64;
    } catch (error) {
      console.error('Erro ao processar base64:', error);
      return null;
    }
  };

  // Função para extrair QR Code da resposta do webhook
  const extractQRCodeFromResponse = (data: any): string | null => {
    console.log('Resposta completa do webhook:', JSON.stringify(data, null, 2));
    
    // Possíveis campos onde o QR Code pode estar
    const possibleFields = [
      'qrCode', 'qrcode', 'codigo_qr', 'qr_code', 'base64', 
      'qr', 'code', 'qrCodeBase64', 'qrcodeBase64'
    ];
    
    for (const field of possibleFields) {
      if (data[field]) {
        console.log(`QR Code encontrado no campo: ${field}`);
        const processedQR = processBase64QRCode(data[field]);
        if (processedQR) {
          return processedQR;
        }
      }
    }
    
    // Verificar em objetos aninhados
    if (data.data && typeof data.data === 'object') {
      console.log('Verificando objeto data aninhado');
      return extractQRCodeFromResponse(data.data);
    }
    
    if (data.result && typeof data.result === 'object') {
      console.log('Verificando objeto result aninhado');
      return extractQRCodeFromResponse(data.result);
    }
    
    console.error('QR Code não encontrado em nenhum campo conhecido');
    return null;
  };

  // Função para obter QR Code do webhook
  const fetchQRCode = useCallback(async (instanceId: string, phoneNum: string, isInitial = false) => {
    if (!user) return;

    try {
      if (!isInitial) setIsRefreshing(true);
      
      console.log('=== BUSCANDO QR CODE ===');
      console.log('Instância:', instanceId);
      console.log('Telefone:', phoneNum);
      console.log('Is Initial:', isInitial);

      const webhookResponse = await fetch('https://n8nsic.agentessic.com/webhook-test/qrcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: instanceId,
          phoneNumber: phoneNum,
          userId: user.id,
          userEmail: user.email,
          action: 'get-qrcode'
        })
      });

      console.log('Status da resposta:', webhookResponse.status);
      console.log('Headers da resposta:', Object.fromEntries(webhookResponse.headers.entries()));

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('Erro HTTP do webhook:', errorText);
        throw new Error(`Erro ${webhookResponse.status}: ${errorText}`);
      }

      const webhookData = await webhookResponse.json();
      console.log('=== DADOS DO WEBHOOK ===');
      console.log(JSON.stringify(webhookData, null, 2));
      
      const extractedQRCode = extractQRCodeFromResponse(webhookData);
      
      if (extractedQRCode) {
        console.log('✅ QR Code extraído com sucesso');
        setQrCode(extractedQRCode);
        
        // Atualizar no banco apenas se for inicial
        if (isInitial) {
          try {
            const { error: dbError } = await supabase
              .from('whatsapp_instances' as any)
              .update({ qr_code: extractedQRCode })
              .eq('instance_id', instanceId)
              .eq('user_id', user.id);
              
            if (dbError) {
              console.error('Erro ao atualizar QR Code no banco:', dbError);
            } else {
              console.log('QR Code salvo no banco com sucesso');
            }
          } catch (dbErr) {
            console.error('Erro na operação do banco:', dbErr);
          }
        }
        
        if (!isInitial) {
          console.log('🔄 QR Code renovado com sucesso');
        }
      } else {
        console.error('❌ QR Code não pôde ser extraído da resposta');
        throw new Error('QR Code não encontrado ou inválido na resposta do webhook');
      }
    } catch (err: any) {
      console.error('=== ERRO AO BUSCAR QR CODE ===');
      console.error('Erro completo:', err);
      console.error('Stack trace:', err.stack);
      
      if (isInitial) {
        toast({
          title: "Erro",
          description: `Erro ao obter QR Code: ${err.message}`,
          variant: "destructive",
        });
      }
    } finally {
      if (!isInitial) setIsRefreshing(false);
    }
  }, [user, toast]);

  // Função para verificar status da conexão
  const checkConnectionStatus = useCallback(async (instanceId: string, phoneNum: string) => {
    if (!user) return;

    try {
      console.log('=== VERIFICANDO STATUS DA CONEXÃO ===');
      console.log('Instância:', instanceId);
      console.log('Telefone:', phoneNum);

      const webhookResponse = await fetch('https://n8nsic.agentessic.com/webhook-test/qrcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: instanceId,
          phoneNumber: phoneNum,
          userId: user.id,
          userEmail: user.email,
          action: 'check-status'
        })
      });

      if (webhookResponse.ok) {
        const statusData = await webhookResponse.json();
        console.log('=== STATUS DA INSTÂNCIA ===');
        console.log(JSON.stringify(statusData, null, 2));
        
        // Verificar diferentes campos de status
        const isConnected = statusData.status === 'connected' || 
                           statusData.connected === true ||
                           statusData.state === 'connected' ||
                           statusData.connectionState === 'open' ||
                           (statusData.data && statusData.data.connected);
        
        if (isConnected) {
          console.log('🟢 WHATSAPP CONECTADO!');
          setInstanceStatus('connected');
          
          // Extrair número de telefone de diferentes campos possíveis
          const detectedPhone = statusData.phoneNumber || 
                               statusData.phone || 
                               statusData.number ||
                               statusData.wuid ||
                               (statusData.data && statusData.data.phoneNumber) ||
                               phoneNum;
          
          setPhoneNumber(detectedPhone);
          
          // Parar renovação automática
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log('🛑 Renovação automática parada');
          }
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          
          // Atualizar no banco
          try {
            const { error: dbError } = await supabase
              .from('whatsapp_instances' as any)
              .update({ 
                status: 'connected',
                phone_number: detectedPhone
              })
              .eq('instance_id', instanceId)
              .eq('user_id', user.id);
              
            if (dbError) {
              console.error('Erro ao atualizar status no banco:', dbError);
            } else {
              console.log('✅ Status atualizado no banco');
            }
          } catch (dbErr) {
            console.error('Erro na operação do banco:', dbErr);
          }

          toast({
            title: "Sucesso!",
            description: `WhatsApp conectado com sucesso! Número: ${detectedPhone}`,
          });
        } else {
          console.log('🟡 Ainda aguardando conexão...');
        }
      } else {
        console.log('❌ Erro ao verificar status:', webhookResponse.status);
      }
    } catch (err) {
      console.error('=== ERRO AO VERIFICAR STATUS ===');
      console.error('Erro:', err);
    }
  }, [user, toast]);

  // Iniciar sistema de renovação automática
  const startQRCodeRenewal = useCallback((instanceId: string, phoneNum: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    currentInstanceRef.current = instanceId;
    setCountdown(30);
    
    // Renovar QR Code a cada 30 segundos
    intervalRef.current = setInterval(() => {
      if (instanceStatus === 'connected') return;
      fetchQRCode(instanceId, phoneNum, false);
      checkConnectionStatus(instanceId, phoneNum);
      setCountdown(30);
    }, 30000);
    
    // Countdown visual
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 30;
        return prev - 1;
      });
    }, 1000);
    
    // Verificar status a cada 5 segundos
    const statusInterval = setInterval(() => {
      if (instanceStatus === 'connected') {
        clearInterval(statusInterval);
        return;
      }
      checkConnectionStatus(instanceId, phoneNum);
    }, 5000);
    
  }, [instanceStatus, fetchQRCode, checkConnectionStatus]);

  const generateQRCode = async () => {
    if (!user || !instanceName.trim() || !phoneNumberInput.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome da instância e o número de telefone",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('=== CRIANDO NOVA INSTÂNCIA ===');
      console.log('Nome da instância:', instanceName.trim());
      console.log('Número de telefone:', phoneNumberInput.trim());
      console.log('User ID:', user.id);
      console.log('User email:', user.email);

      // Criar instância via webhook
      const webhookResponse = await fetch('https://n8nsic.agentessic.com/webhook-test/qrcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: instanceName.trim(),
          phoneNumber: phoneNumberInput.trim(),
          userId: user.id,
          userEmail: user.email,
          action: 'create-instance'
        })
      });

      console.log('Status da criação:', webhookResponse.status);

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('Erro HTTP na criação:', errorText);
        throw new Error(`Erro ${webhookResponse.status}: ${errorText}`);
      }

      const webhookData = await webhookResponse.json();
      console.log('=== INSTÂNCIA CRIADA ===');
      console.log(JSON.stringify(webhookData, null, 2));
      
      // Salvar instância no banco
      try {
        const { error: dbError } = await supabase
          .from('whatsapp_instances' as any)
          .insert({
            user_id: user.id,
            instance_id: instanceName.trim(),
            phone_number: phoneNumberInput.trim(),
            status: 'pending'
          });

        if (dbError) {
          console.error('Erro ao salvar no banco:', dbError);
        } else {
          console.log('✅ Instância salva no banco');
        }
      } catch (dbErr) {
        console.error('Erro na operação do banco:', dbErr);
      }

      // Buscar QR Code inicial
      await fetchQRCode(instanceName.trim(), phoneNumberInput.trim(), true);
      
      // Iniciar sistema de renovação
      startQRCodeRenewal(instanceName.trim(), phoneNumberInput.trim());

      toast({
        title: "Sucesso",
        description: "Instância criada! Escaneie o QR Code com seu WhatsApp.",
      });
      
    } catch (err: any) {
      console.error('=== ERRO COMPLETO ===');
      console.error('Erro:', err);
      console.error('Stack:', err.stack);
      
      toast({
        title: "Erro",
        description: `Erro ao criar instância: ${err.message || 'Erro desconhecido'}`,
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Número de Telefone</Label>
              <Input
                id="phoneNumber"
                value={phoneNumberInput}
                onChange={(e) => setPhoneNumberInput(e.target.value)}
                placeholder="Ex: 5511999999999"
                className="w-full"
              />
            </div>
          </div>
          
          <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">QR Code aparecerá aqui</p>
            </div>
          </div>
          
          <Button 
            onClick={generateQRCode} 
            disabled={isGenerating || !instanceName.trim() || !phoneNumberInput.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando instância...
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
          <div className="w-48 h-48 mx-auto bg-white border rounded-lg p-4 relative">
            <img src={qrCode} alt="QR Code" className="w-full h-full object-contain" />
            {isRefreshing && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            )}
          </div>
          
          <div className="text-center space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-pulse">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                </div>
                <p className="text-blue-600 text-sm font-medium">
                  Aguardando conexão...
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    Renovando em {countdown}s
                  </span>
                </div>
                <Progress value={(30 - countdown) * (100 / 30)} className="w-32 mx-auto h-1" />
              </div>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed">
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
