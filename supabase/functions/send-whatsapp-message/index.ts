import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppMessageRequest {
  type: 'text' | 'media' | 'sticker' | 'poll' | 'button' | 'list' | 'test'
  sender: string
  number?: string
  message?: string
  footer?: string
  media_type?: string
  url?: string
  caption?: string
  name?: string
  option?: string[]
  countable?: string
  button?: any[]
  list?: any[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, data } = await req.json()
    
    let apiUrl = ''
    let requestBody: any = {}

    switch (type) {
      case 'text':
        apiUrl = 'https://app.x-growth.tech/send-message'
        requestBody = { api_key: data.api_key, sender: data.sender, number: data.number, message: data.message, footer: data.footer || '' }
        break
      case 'media':
        apiUrl = 'https://app.x-growth.tech/send-media'
        requestBody = { api_key: data.api_key, sender: data.sender, number: data.number, media_type: data.media_type, url: data.url, caption: data.caption || '', footer: data.footer || '' }
        break
      case 'sticker':
        apiUrl = 'https://app.x-growth.tech/send-sticker'
        requestBody = { api_key: data.api_key, sender: data.sender, number: data.number, url: data.url }
        break
      case 'poll':
        apiUrl = 'https://app.x-growth.tech/send-poll'
        requestBody = { api_key: data.api_key, sender: data.sender, number: data.number, name: data.name, option: data.option, countable: data.countable }
        break
      case 'button':
        apiUrl = 'https://app.x-growth.tech/send-button'
        requestBody = { api_key: data.api_key, sender: data.sender, number: data.number, message: data.message, button: data.button, footer: data.footer || '', url: data.url || '' }
        break
      case 'channel':
        apiUrl = 'https://app.x-growth.tech/send-text-channel'
        requestBody = { api_key: data.api_key, sender: data.sender, url: data.url, message: data.message, footer: data.footer || '' }
        break
      default:
        throw new Error('نوع الرسالة غير مدعوم')
    }

    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) })
    const result = await response.json()
    
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.ok ? 200 : 400 })

  } catch (error) {
    return new Response(JSON.stringify({ status: false, message: error.message || 'حدث خطأ في الخادم' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})