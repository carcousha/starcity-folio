import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

interface WhatsAppRequest {
  api_key: string
  sender: string
  number: string
  message: string
  footer?: string
  url?: string
  media_type?: 'image' | 'document' | 'video' | 'audio'
  caption?: string
}

interface WhatsAppResponse {
  status: boolean
  message: string
  data?: any
  error?: string
}

serve(async (req) => {
  console.log('🔍 [Edge Function] Request received:', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ [Edge Function] CORS preflight handled')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body = await req.json()
    console.log('📥 [Edge Function] Request body:', {
      ...body,
      api_key: body.api_key ? `${body.api_key.substring(0, 8)}...` : 'NOT SET'
    })

    const { api_key, sender, number, message, footer, url, media_type, caption }: WhatsAppRequest = body

    // Validate required fields
    if (!api_key) {
      console.error('❌ [Edge Function] Missing api_key')
      return new Response(
        JSON.stringify({
          status: false,
          message: 'مفتاح API مطلوب',
          error: 'MISSING_API_KEY'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!sender) {
      console.error('❌ [Edge Function] Missing sender')
      return new Response(
        JSON.stringify({
          status: false,
          message: 'رقم المرسل مطلوب',
          error: 'MISSING_SENDER'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!number) {
      console.error('❌ [Edge Function] Missing number')
      return new Response(
        JSON.stringify({
          status: false,
          message: 'رقم الهاتف مطلوب',
          error: 'MISSING_NUMBER'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!message) {
      console.error('❌ [Edge Function] Missing message')
      return new Response(
        JSON.stringify({
          status: false,
          message: 'نص الرسالة مطلوب',
          error: 'MISSING_MESSAGE'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Clean phone number
    let cleanNumber = number.replace(/\D/g, '')
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1)
    }
    if (!cleanNumber.startsWith('971')) {
      cleanNumber = '971' + cleanNumber
    }

    console.log('📱 [Edge Function] Cleaned number:', cleanNumber)

    // Build API URL - Choose endpoint based on media presence
    const apiUrl = url ? 'https://app.x-growth.tech/send-media' : 'https://app.x-growth.tech/send-message'
    const params = new URLSearchParams({
      api_key,
      sender,
      number: cleanNumber,
      message
    })

    // Add footer if provided and not default
    if (footer && footer.trim() && !footer.includes('StarCity Folio')) {
      params.append('footer', footer.trim())
    }

    // Add media parameters if media is provided
    if (url) {
      params.append('url', url)
      if (media_type) {
        params.append('media_type', media_type)
      }
      if (caption) {
        params.append('caption', caption)
      }
    }

    const fullUrl = `${apiUrl}?${params.toString()}`
    console.log('🌐 [Edge Function] Calling WhatsApp API:', fullUrl.replace(api_key, `${api_key.substring(0, 8)}...`))

    // Make the API call
    const startTime = Date.now()
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'StarCity-Folio/1.0'
      }
    })
    const endTime = Date.now()
    const responseTime = endTime - startTime

    console.log('⏱️ [Edge Function] API response time:', responseTime + 'ms')
    console.log('📥 [Edge Function] API response status:', response.status, response.statusText)

    // Get response text
    const responseText = await response.text()
    console.log('📄 [Edge Function] API response text:', responseText)

    // Parse response
    let apiResponse: any
    try {
      apiResponse = JSON.parse(responseText)
      console.log('✅ [Edge Function] Parsed JSON response:', apiResponse)
    } catch (parseError) {
      console.log('⚠️ [Edge Function] Could not parse JSON, using raw text')
      apiResponse = { raw_response: responseText }
    }

    // Determine success
    let isSuccess = false
    let statusMessage = ''

    if (response.ok) {
      // Check for success indicators in response
      const responseLower = responseText.toLowerCase()
      if (responseLower.includes('success') || 
          responseLower.includes('تم') || 
          responseLower.includes('نجح') ||
          responseLower.includes('sent') ||
          responseLower.includes('delivered')) {
        isSuccess = true
        statusMessage = 'تم إرسال الرسالة بنجاح!'
      } else if (responseLower.includes('error') || 
                 responseLower.includes('فشل') || 
                 responseLower.includes('خطأ') ||
                 responseLower.includes('failed')) {
        isSuccess = false
        statusMessage = 'فشل في إرسال الرسالة: ' + responseText
      } else {
        // Default to success if status is 200 and no clear error
        isSuccess = true
        statusMessage = 'تم إرسال الرسالة بنجاح!'
      }
    } else {
      isSuccess = false
      statusMessage = `خطأ في الاتصال: ${response.status} ${response.statusText}`
    }

    const result: WhatsAppResponse = {
      status: isSuccess,
      message: statusMessage,
      data: {
        api_response: apiResponse,
        response_time_ms: responseTime,
        http_status: response.status,
        cleaned_number: cleanNumber
      }
    }

    if (!isSuccess) {
      result.error = 'API_CALL_FAILED'
    }

    console.log('📤 [Edge Function] Sending response:', {
      ...result,
      data: {
        ...result.data,
        api_response: 'HIDDEN_FOR_LOG'
      }
    })

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 [Edge Function] Unexpected error:', error)
    
    return new Response(
      JSON.stringify({
        status: false,
        message: 'خطأ في الخادم: ' + error.message,
        error: 'INTERNAL_ERROR'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
