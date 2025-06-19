
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configurações da EvolutionAPI
const EVOLUTION_API_SERVER_URL = Deno.env.get('EVOLUTION_API_SERVER_URL') || 'https://evosic.agentessic.com'
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || '67dd855b923b57335bada6b4a0582576'

const evolutionHeaders = {
  'Content-Type': 'application/json',
  'apikey': EVOLUTION_API_KEY
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

    const body = req.method === 'POST' ? await req.json() : {}
    const { action } = body

    switch (action) {
      case 'create-instance': {
        // Gerar ID único para a instância
        const instanceId = `user_${user.id.substring(0, 8)}_${Date.now()}`
        
        try {
          // Criar instância na EvolutionAPI
          const evolutionResponse = await fetch(`${EVOLUTION_API_SERVER_URL}/instance/create`, {
            method: 'POST',
            headers: evolutionHeaders,
            body: JSON.stringify({
              instanceName: instanceId,
              qrcode: true,
              integration: 'WHATSAPP-BAILEYS'
            })
          })

          const evolutionData = await evolutionResponse.json()

          if (!evolutionResponse.ok) {
            throw new Error(`EvolutionAPI Error: ${evolutionData.message}`)
          }

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
              evolutionData: evolutionData,
              message: 'Instância criada com sucesso'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        } catch (evolutionError) {
          console.error('Erro na EvolutionAPI:', evolutionError)
          throw new Error(`Falha ao criar instância: ${evolutionError.message}`)
        }
      }

      case 'get-qrcode': {
        const { instanceId } = body
        
        try {
          const qrResponse = await fetch(`${EVOLUTION_API_SERVER_URL}/instance/qrcode/${instanceId}`, {
            headers: evolutionHeaders
          })

          const qrData = await qrResponse.json()

          if (!qrResponse.ok) {
            throw new Error(`EvolutionAPI QR Error: ${qrData.message}`)
          }

          // Atualizar QR code no banco
          await supabaseClient
            .from('whatsapp_instances')
            .update({ qr_code: qrData.qrcode })
            .eq('instance_id', instanceId)
            .eq('user_id', user.id)

          return new Response(
            JSON.stringify({ 
              success: true, 
              qrCode: qrData.qrcode 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        } catch (error) {
          throw new Error(`Falha ao obter QR Code: ${error.message}`)
        }
      }

      case 'check-status': {
        const { instanceId } = body
        
        try {
          const statusResponse = await fetch(`${EVOLUTION_API_SERVER_URL}/instance/connectionState/${instanceId}`, {
            headers: evolutionHeaders
          })

          const statusData = await statusResponse.json()

          if (!statusResponse.ok) {
            throw new Error(`EvolutionAPI Status Error: ${statusData.message}`)
          }

          let dbStatus = 'pending'
          let phoneNumber = null

          if (statusData.instance?.state === 'open') {
            dbStatus = 'connected'
            // Buscar informações do número conectado
            try {
              const infoResponse = await fetch(`${EVOLUTION_API_SERVER_URL}/instance/info/${instanceId}`, {
                headers: evolutionHeaders
              })
              const infoData = await infoResponse.json()
              phoneNumber = infoData.instance?.wuid || null
            } catch (err) {
              console.log('Erro ao buscar info da instância:', err)
            }
          } else if (statusData.instance?.state === 'close') {
            dbStatus = 'disconnected'
          }

          // Atualizar status no banco
          const updateData: any = { status: dbStatus }
          if (phoneNumber) updateData.phone_number = phoneNumber

          await supabaseClient
            .from('whatsapp_instances')
            .update(updateData)
            .eq('instance_id', instanceId)
            .eq('user_id', user.id)

          return new Response(
            JSON.stringify({ 
              success: true, 
              status: dbStatus,
              phoneNumber: phoneNumber,
              evolutionState: statusData.instance?.state
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        } catch (error) {
          throw new Error(`Falha ao verificar status: ${error.message}`)
        }
      }

      case 'send-message': {
        const { instanceId, phoneNumber, message, mediaUrl } = body
        
        try {
          const payload: any = {
            number: phoneNumber,
            textMessage: {
              text: message
            }
          }

          if (mediaUrl) {
            payload.mediaMessage = {
              mediatype: 'image',
              media: mediaUrl
            }
          }

          const sendResponse = await fetch(`${EVOLUTION_API_SERVER_URL}/message/sendText/${instanceId}`, {
            method: 'POST',
            headers: evolutionHeaders,
            body: JSON.stringify(payload)
          })

          const sendData = await sendResponse.json()

          if (!sendResponse.ok) {
            throw new Error(`EvolutionAPI Send Error: ${sendData.message}`)
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              messageId: sendData.key?.id,
              data: sendData
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        } catch (error) {
          throw new Error(`Falha ao enviar mensagem: ${error.message}`)
        }
      }

      case 'send-bulk': {
        const { instanceId, contacts, message, mediaUrl } = body
        
        const results = []
        
        for (const contact of contacts) {
          try {
            const payload: any = {
              number: contact.phone,
              textMessage: {
                text: message
              }
            }

            if (mediaUrl) {
              payload.mediaMessage = {
                mediatype: 'image',
                media: mediaUrl
              }
            }

            const sendResponse = await fetch(`${EVOLUTION_API_SERVER_URL}/message/sendText/${instanceId}`, {
              method: 'POST',
              headers: evolutionHeaders,
              body: JSON.stringify(payload)
            })

            const sendData = await sendResponse.json()

            results.push({
              contact: contact,
              success: sendResponse.ok,
              messageId: sendData.key?.id,
              error: sendResponse.ok ? null : sendData.message
            })

            // Delay entre mensagens para evitar rate limit
            await new Promise(resolve => setTimeout(resolve, 1000))

          } catch (error) {
            results.push({
              contact: contact,
              success: false,
              error: error.message
            })
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            results: results,
            totalSent: results.filter(r => r.success).length,
            totalFailed: results.filter(r => !r.success).length
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'send-to-n8n': {
        const { instanceId, apiKey, contacts, message } = body
        
        const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
        
        if (!n8nWebhookUrl) {
          throw new Error('N8N webhook URL não configurada')
        }

        const payload = {
          instanceId,
          apiKey: EVOLUTION_API_KEY,
          serverUrl: EVOLUTION_API_SERVER_URL,
          contacts,
          message,
          timestamp: new Date().toISOString(),
          userId: user.id
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
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
