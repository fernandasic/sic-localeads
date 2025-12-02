import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Autenticar usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { action, instanceId, phoneNumber } = await req.json();

    // Buscar credenciais do usuário
    const { data: credentials, error: credError } = await supabase
      .from('user_evolution_credentials')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ 
          error: 'Credenciais da EvolutionAPI não configuradas. Configure suas credenciais primeiro.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const evolutionHeaders = {
      'Content-Type': 'application/json',
      'apikey': credentials.api_key,
    };

    console.log(`Action: ${action}, Instance: ${instanceId}`);

    switch (action) {
      case 'create-instance': {
        // Criar instância no EvolutionAPI
        const createResponse = await fetch(`${credentials.api_url}/instance/create`, {
          method: 'POST',
          headers: evolutionHeaders,
          body: JSON.stringify({
            instanceName: instanceId,
            token: credentials.api_key,
            qrcode: true,
          }),
        });

        const createData = await createResponse.json();
        console.log('Create instance response:', createData);

        if (!createResponse.ok) {
          throw new Error(`Erro ao criar instância: ${JSON.stringify(createData)}`);
        }

        // Salvar no banco de dados
        const { data: instance, error: insertError } = await supabase
          .from('whatsapp_instances')
          .insert({
            user_id: user.id,
            instance_id: instanceId,
            phone_number: phoneNumber,
            status: 'pending',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao salvar instância:', insertError);
          throw insertError;
        }

        return new Response(
          JSON.stringify({ success: true, data: createData, instance }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-qrcode': {
        // Buscar QR code
        const qrResponse = await fetch(`${credentials.api_url}/instance/connect/${instanceId}`, {
          method: 'GET',
          headers: evolutionHeaders,
        });

        const qrData = await qrResponse.json();
        console.log('QR code response:', qrData);

        if (!qrResponse.ok) {
          throw new Error(`Erro ao buscar QR code: ${JSON.stringify(qrData)}`);
        }

        // Atualizar no banco
        if (qrData.base64 || qrData.code || qrData.qrcode) {
          const qrCode = qrData.base64 || qrData.code || qrData.qrcode;
          await supabase
            .from('whatsapp_instances')
            .update({ qr_code: qrCode })
            .eq('user_id', user.id)
            .eq('instance_id', instanceId);
        }

        return new Response(
          JSON.stringify({ success: true, data: qrData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check-status': {
        // Verificar status da conexão
        const statusResponse = await fetch(`${credentials.api_url}/instance/connectionState/${instanceId}`, {
          method: 'GET',
          headers: evolutionHeaders,
        });

        const statusData = await statusResponse.json();
        console.log('Status response:', statusData);

        if (!statusResponse.ok) {
          throw new Error(`Erro ao verificar status: ${JSON.stringify(statusData)}`);
        }

        // Atualizar status no banco
        const status = statusData.state === 'open' ? 'connected' : 'pending';
        await supabase
          .from('whatsapp_instances')
          .update({ 
            status,
            phone_number: statusData.instance?.phoneNumber || phoneNumber
          })
          .eq('user_id', user.id)
          .eq('instance_id', instanceId);

        return new Response(
          JSON.stringify({ success: true, data: statusData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send-message': {
        const { number, messageType, message, mediaUrl } = await req.json();

        const messagePayload: any = {
          number: number.replace(/\D/g, ''),
        };

        if (messageType === 'text') {
          messagePayload.text = message;
        } else {
          messagePayload.mediaMessage = {
            mediatype: messageType,
            media: mediaUrl,
          };
          if (message) {
            messagePayload.mediaMessage.caption = message;
          }
        }

        const sendResponse = await fetch(
          `${credentials.api_url}/message/sendText/${instanceId}`,
          {
            method: 'POST',
            headers: evolutionHeaders,
            body: JSON.stringify(messagePayload),
          }
        );

        const sendData = await sendResponse.json();
        console.log('Send message response:', sendData);

        return new Response(
          JSON.stringify({ success: true, data: sendData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Ação inválida' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});