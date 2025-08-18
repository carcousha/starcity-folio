// Edge Function للتعامل مع مشاكل CORS في WhatsApp API
// يعمل كـ proxy بين التطبيق و x-growth.tech API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { api_key, sender, number, message, footer } = await req.json()

    // Validate required fields
    if (!api_key || !sender || !number || !message) {
      return new Response(
        JSON.stringify({ 
          status: false, 
          msg: 'Missing required fields: api_key, sender, number, message' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Sending WhatsApp message:', { sender, number, message: message.substring(0, 50) + '...' })

    // Prepare data for x-growth.tech API
    const apiData = {
      api_key,
      sender,
      number,
      message,
      footer: footer || "Sent via StarCity Folio"
    }

    // Call x-growth.tech API
    const apiUrl = 'https://app.x-growth.tech/send-message'
    
    // Try POST first
    let response
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(apiData)
      })
    } catch (postError) {
      console.log('POST failed, trying GET:', postError)
      
      // Fallback to GET request
      const urlParams = new URLSearchParams(apiData)
      const getUrl = `${apiUrl}?${urlParams.toString()}`
      
      response = await fetch(getUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('API response:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({ 
        status: false, 
        msg: `Error: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
