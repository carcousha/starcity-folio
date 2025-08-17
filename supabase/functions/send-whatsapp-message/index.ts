import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppMessageRequest {
  type: 'text' | 'media' | 'sticker' | 'poll' | 'button' | 'list' | 'test'
  sender: string
  number: string
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
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, sender, number, message, footer, media_type, url, caption, name, option, countable, button, list }: WhatsAppMessageRequest = await req.json()
    
    // Get API key from Supabase secrets
    const apiKey = Deno.env.get('X_GROWTH_API_KEY')
    if (!apiKey) {
      console.error('❌ X_GROWTH_API_KEY not found in environment')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'API Key غير متوفر' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`📤 إرسال رسالة ${type} إلى ${number}`)

    let apiUrl = ''
    let requestBody: any = {}

    // Build request based on message type
    switch (type) {
      case 'text':
        apiUrl = 'https://app.x-growth.tech/send-message'
        requestBody = {
          api_key: apiKey,
          sender,
          number,
          message,
          footer: footer || ''
        }
        break

      case 'media':
        apiUrl = 'https://app.x-growth.tech/send-media'
        requestBody = {
          api_key: apiKey,
          sender,
          number,
          media_type,
          url,
          caption: caption || '',
          footer: footer || ''
        }
        break

      case 'sticker':
        apiUrl = 'https://app.x-growth.tech/send-sticker'
        requestBody = {
          api_key: apiKey,
          sender,
          number,
          url
        }
        break

      case 'poll':
        apiUrl = 'https://app.x-growth.tech/send-poll'
        requestBody = {
          api_key: apiKey,
          sender,
          number,
          name,
          option,
          countable
        }
        break

      case 'button':
        apiUrl = 'https://app.x-growth.tech/send-button'
        requestBody = {
          api_key: apiKey,
          sender,
          number,
          message,
          button,
          footer: footer || '',
          url: url || ''
        }
        break

      case 'list':
        apiUrl = 'https://app.x-growth.tech/send-list'
        requestBody = {
          api_key: apiKey,
          sender,
          number,
          message,
          list,
          footer: footer || ''
        }
        break

      case 'test':
        apiUrl = 'https://app.x-growth.tech/send-message'
        requestBody = {
          api_key: apiKey,
          sender,
          number: number || '+971501234567',
          message: message || 'اختبار الاتصال'
        }
        break

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'نوع الرسالة غير مدعوم' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    console.log(`🌐 طلب إلى: ${apiUrl}`)
    console.log(`📋 البيانات: ${JSON.stringify({...requestBody, api_key: '[مخفي]'})}`)

    // Send request to x-growth API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    const responseText = await response.text()
    console.log(`📥 استجابة x-growth: ${response.status} - ${responseText.substring(0, 200)}`)

    // Check if request was successful
    const success = response.ok || responseText.includes('success') || responseText.includes('تم') || responseText.includes('نجح')
    
    return new Response(
      JSON.stringify({
        success,
        message: success ? 'تم إرسال الرسالة بنجاح' : 'فشل في إرسال الرسالة',
        data: responseText,
        status: response.status
      }),
      {
        status: success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ خطأ في Edge Function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'حدث خطأ في الخادم',
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})