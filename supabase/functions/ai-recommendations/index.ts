import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecommendationsResponse {
  success: boolean;
  broker_id: string;
  recommendations: {
    high_priority: Array<{
      client_id: string;
      client_name: string;
      properties: Array<{
        property_id: string;
        title: string;
        match_score: number;
        match_reasons: string[];
      }>;
      urgency_score: number;
      suggested_action: string;
    }>;
    market_opportunities: Array<{
      property_id: string;
      title: string;
      opportunity_type: string;
      confidence: number;
      potential_clients: number;
    }>;
    client_insights: Array<{
      client_id: string;
      client_name: string;
      last_contact: string;
      engagement_score: number;
      next_best_action: string;
    }>;
  };
  market_summary: {
    total_properties: number;
    available_properties: number;
    average_price: number;
    price_trend: string;
    hot_areas: string[];
  };
  execution_time_ms: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const startTime = Date.now()

    // Get broker_id from URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const brokerId = pathParts[pathParts.length - 1]

    if (!brokerId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Broker ID is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch broker's clients
    const { data: clients, error: clientsError } = await supabase
      .from('ai_clients')
      .select('*')
      .eq('assigned_broker_id', brokerId)

    if (clientsError) {
      throw clientsError
    }

    // Fetch available properties
    const { data: properties, error: propertiesError } = await supabase
      .from('ai_properties')
      .select('*')
      .eq('status', 'available')

    if (propertiesError) {
      throw propertiesError
    }

    // Generate recommendations (placeholder logic - ready for AI integration)
    const recommendations = generateBrokerRecommendations(clients, properties, brokerId)
    
    // Generate market insights
    const marketSummary = generateMarketSummary(properties)

    const executionTime = Date.now() - startTime

    // Log the operation
    await supabase
      .from('ai_engine_logs')
      .insert({
        operation: 'broker_recommendations',
        input_data: { broker_id: brokerId, client_count: clients.length, property_count: properties.length },
        output_data: { 
          recommendations_count: recommendations.high_priority.length + recommendations.market_opportunities.length,
          market_summary: marketSummary
        },
        execution_time_ms: executionTime,
        status: 'success'
      })

    const response: RecommendationsResponse = {
      success: true,
      broker_id: brokerId,
      recommendations,
      market_summary: marketSummary,
      execution_time_ms: executionTime
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('AI Recommendations Error:', error)

    // Log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      await supabase
        .from('ai_engine_logs')
        .insert({
          operation: 'broker_recommendations',
          input_data: { error: 'Request processing failed' },
          output_data: null,
          execution_time_ms: 0,
          status: 'error',
          error_message: error.message
        })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Generate broker-specific recommendations
function generateBrokerRecommendations(clients: any[], properties: any[], brokerId: string) {
  const highPriority: any[] = []
  const marketOpportunities: any[] = []
  const clientInsights: any[] = []

  // Process each client
  clients.forEach(client => {
    const clientProperties = properties.filter(property => {
      // Basic matching logic (ready for AI enhancement)
      const preferences = client.preferences || {}
      
      if (preferences.property_types && !preferences.property_types.includes(property.type)) {
        return false
      }
      
      if (preferences.max_price && property.price > preferences.max_price) {
        return false
      }
      
      if (preferences.min_price && property.price < preferences.min_price) {
        return false
      }
      
      return true
    })

    if (clientProperties.length > 0) {
      // Calculate urgency score based on client activity
      const urgencyScore = calculateUrgencyScore(client)
      
      if (urgencyScore > 0.7) {
        highPriority.push({
          client_id: client.id,
          client_name: client.name,
          properties: clientProperties.slice(0, 3).map(property => ({
            property_id: property.id,
            title: property.title,
            match_score: calculateMatchScore(client, property),
            match_reasons: generateMatchReasons(client, property)
          })),
          urgency_score: urgencyScore,
          suggested_action: getSuggestedAction(urgencyScore, client)
        })
      }

      clientInsights.push({
        client_id: client.id,
        client_name: client.name,
        last_contact: client.updated_at || client.created_at,
        engagement_score: calculateEngagementScore(client),
        next_best_action: getNextBestAction(client, clientProperties.length)
      })
    }
  })

  // Identify market opportunities
  const propertyOpportunities = properties.map(property => {
    const matchingClients = clients.filter(client => {
      const preferences = client.preferences || {}
      return (!preferences.property_types || preferences.property_types.includes(property.type)) &&
             (!preferences.max_price || property.price <= preferences.max_price)
    })

    if (matchingClients.length > 0) {
      marketOpportunities.push({
        property_id: property.id,
        title: property.title,
        opportunity_type: 'high_demand',
        confidence: Math.min(0.9, matchingClients.length / 10),
        potential_clients: matchingClients.length
      })
    }
  })

  return {
    high_priority: highPriority.slice(0, 10),
    market_opportunities: marketOpportunities.slice(0, 15),
    client_insights: clientInsights.slice(0, 20)
  }
}

// Calculate urgency score for a client
function calculateUrgencyScore(client: any): number {
  // Placeholder logic - ready for AI enhancement
  let score = 0.5 // Base score
  
  // New clients get higher urgency
  const daysSinceCreation = (Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreation < 7) score += 0.3
  
  // Clients with recent updates get higher urgency
  if (client.updated_at && client.updated_at !== client.created_at) {
    const daysSinceUpdate = (Date.now() - new Date(client.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpdate < 3) score += 0.2
  }
  
  return Math.min(1.0, score)
}

// Calculate match score between client and property
function calculateMatchScore(client: any, property: any): number {
  let score = 0
  const preferences = client.preferences || {}
  
  // Property type match
  if (preferences.property_types && preferences.property_types.includes(property.type)) {
    score += 40
  }
  
  // Price match
  if (preferences.max_price && property.price <= preferences.max_price) {
    const priceRatio = property.price / preferences.max_price
    score += Math.max(0, 30 * (1 - priceRatio))
  }
  
  // Area match
  if (preferences.min_area && preferences.max_area) {
    if (property.area >= preferences.min_area && property.area <= preferences.max_area) {
      score += 30
    }
  }
  
  return Math.min(100, score)
}

// Generate match reasons
function generateMatchReasons(client: any, property: any): string[] {
  const reasons: string[] = []
  const preferences = client.preferences || {}
  
  if (preferences.property_types && preferences.property_types.includes(property.type)) {
    reasons.push('Property type matches preference')
  }
  
  if (preferences.max_price && property.price <= preferences.max_price) {
    reasons.push('Within budget range')
  }
  
  if (preferences.min_area && property.area >= preferences.min_area) {
    reasons.push('Meets minimum area requirement')
  }
  
  return reasons
}

// Get suggested action based on urgency
function getSuggestedAction(urgencyScore: number, client: any): string {
  if (urgencyScore > 0.9) return 'Immediate follow-up required'
  if (urgencyScore > 0.8) return 'Schedule viewing this week'
  if (urgencyScore > 0.7) return 'Send detailed property information'
  return 'Regular follow-up'
}

// Calculate engagement score
function calculateEngagementScore(client: any): number {
  // Placeholder logic - ready for AI enhancement
  let score = 0.5
  
  if (client.preferences && Object.keys(client.preferences).length > 0) {
    score += 0.2
  }
  
  if (client.updated_at && client.updated_at !== client.created_at) {
    score += 0.3
  }
  
  return Math.min(1.0, score)
}

// Get next best action for client
function getNextBestAction(client: any, matchingPropertiesCount: number): string {
  if (matchingPropertiesCount === 0) {
    return 'Expand search criteria or add new properties'
  }
  
  if (matchingPropertiesCount < 3) {
    return 'Send available properties and request feedback'
  }
  
  return 'Schedule property viewings'
}

// Generate market summary
function generateMarketSummary(properties: any[]) {
  const totalProperties = properties.length
  const availableProperties = properties.filter(p => p.status === 'available').length
  
  const prices = properties.map(p => p.price).filter(p => p !== null && p !== undefined)
  const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
  
  // Simple price trend calculation
  const sortedByDate = properties
    .filter(p => p.listed_at)
    .sort((a, b) => new Date(a.listed_at).getTime() - new Date(b.listed_at).getTime())
  
  let priceTrend = 'stable'
  if (sortedByDate.length >= 2) {
    const recentAvg = sortedByDate.slice(-5).reduce((sum, p) => sum + (p.price || 0), 0) / 5
    const olderAvg = sortedByDate.slice(0, 5).reduce((sum, p) => sum + (p.price || 0), 0) / 5
    if (recentAvg > olderAvg * 1.1) priceTrend = 'increasing'
    else if (recentAvg < olderAvg * 0.9) priceTrend = 'decreasing'
  }
  
  // Identify hot areas (placeholder logic)
  const hotAreas = ['Downtown', 'Business District', 'Residential Zone']
  
  return {
    total_properties: totalProperties,
    available_properties: availableProperties,
    average_price: Math.round(averagePrice),
    price_trend: priceTrend,
    hot_areas: hotAreas
  }
}
