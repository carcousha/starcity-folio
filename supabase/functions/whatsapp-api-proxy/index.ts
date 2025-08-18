import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface WhatsAppRequest {
  api_key: string
  sender: string
  number: string
  message: string
  footer?: string
  message_type?: string
  media_url?: string
  media_type?: string
  button_text?: string
  button_url?: string
}

interface WhatsAppResponse {
  status: boolean
  message: string
  api_response?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { api_key, sender, number, message, footer, message_type, media_url, media_type, button_text, button_url }: WhatsAppRequest = await req.json()

    // Validate required fields
    if (!api_key || !sender || !number || !message) {
      return new Response(
        JSON.stringify({
          status: false,
          message: 'Missing required fields: api_key, sender, number, message'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Build API URL based on message type
    let apiUrl = 'https://app.x-growth.tech/send-message'
    const params = new URLSearchParams({
      api_key,
      sender,
      number,
      message
    })
    
    // إضافة footer فقط إذا كان موجوداً وغير فارغ وليس "StarCity Folio"
    if (footer && 
        footer.trim() && 
        !footer.includes('StarCity Folio')) {
      params.append('footer', footer.trim())
    }

    // Add additional parameters based on message type
    if (message_type === 'media' && media_url && media_type) {
      params.append('media_url', media_url)
      params.append('media_type', media_type)
    } else if (message_type === 'button' && button_text && button_url) {
      params.append('button_text', button_text)
      params.append('button_url', button_url)
    }

    const fullUrl = `${apiUrl}?${params.toString()}`
    console.log('Calling WhatsApp API:', fullUrl)

    // Make the API call
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'StarCity-Folio/1.0'
      }
    })

    const responseText = await response.text()
    console.log('API Response:', responseText)

    // Parse the response
    let apiResponse: any
    try {
      apiResponse = JSON.parse(responseText)
    } catch {
      apiResponse = { raw_response: responseText }
    }

    // Determine success based on response
    let isSuccess = false
    let statusMessage = ''

    if (response.ok) {
      if (responseText.includes('success') || responseText.includes('تم') || responseText.includes('نجح')) {
        isSuccess = true
        statusMessage = 'تم إرسال الرسالة بنجاح!'
      } else if (responseText.includes('error') || responseText.includes('فشل') || responseText.includes('خطأ')) {
        isSuccess = false
        statusMessage = 'فشل في إرسال الرسالة: ' + responseText
      } else {
        // If we can't determine from text, check status code
        isSuccess = response.status === 200
        statusMessage = isSuccess ? 'تم إرسال الرسالة بنجاح!' : 'فشل في إرسال الرسالة'
      }
    } else {
      isSuccess = false
      statusMessage = `خطأ في الاتصال: ${response.status} ${response.statusText}`
    }

    const result: WhatsAppResponse = {
      status: isSuccess,
      message: statusMessage,
      api_response: apiResponse
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('WhatsApp API Proxy Error:', error)
    
    return new Response(
      JSON.stringify({
        status: false,
        message: 'خطأ في الخادم: ' + error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
