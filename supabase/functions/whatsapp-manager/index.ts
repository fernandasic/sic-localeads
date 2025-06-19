
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()
    const body = req.method === 'POST' ? await req.json() : {}

    switch (action) {
      case 'create-instance': {
        // Gerar ID único para a instância
        const instanceId = `${user.id.substring(0, 8)}_${Date.now()}`
        
        // Inserir nova instância no banco
        const { data: instance, error } = await supabaseClient
          .from('whatsapp_instances')
          .insert({
            user_id: user.id,
            instance_id: instanceId,
            status: 'pending'
          })
          .select()
          .single()

        if (error) {
          throw error
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            instance: instance,
            message: 'Instância criada com sucesso'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update-qr': {
        const { instanceId, qrCode } = body
        
        const { error } = await supabaseClient
          .from('whatsapp_instances')
          .update({ qr_code: qrCode })
          .eq('instance_id', instanceId)
          .eq('user_id', user.id)

        if (error) {
          throw error
        }

        return new Response(
          JSON.stringify({ success: true, message: 'QR Code atualizado' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update-status': {
        const { instanceId, status, phoneNumber, apiKey } = body
        
        const updateData: any = { status }
        if (phoneNumber) updateData.phone_number = phoneNumber
        if (apiKey) updateData.api_key = apiKey

        const { error } = await supabaseClient
          .from('whatsapp_instances')
          .update(updateData)
          .eq('instance_id', instanceId)
          .eq('user_id', user.id)

        if (error) {
          throw error
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Status atualizado' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'send-to-n8n': {
        const { instanceId, apiKey, phoneNumbers, message } = body
        
        // Aqui você colocará a URL do seu webhook do n8n
        const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
        
        if (!n8nWebhookUrl) {
          throw new Error('N8N webhook URL não configurada')
        }

        const payload = {
          instanceId,
          apiKey,
          phoneNumbers,
          message,
          timestamp: new Date().toISOString()
        }

        const response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error('Erro ao enviar para n8n')
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Enviado para n8n com sucesso' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Ação não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
