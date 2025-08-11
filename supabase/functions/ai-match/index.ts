import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MatchRequest {
  client_id: string;
  refresh_score?: boolean;
  max_results?: number;
  min_score?: number;
}

interface PropertyMatch {
  property_id: string;
  property: any;
  match_score: number;
  match_reasons: string[];
  confidence: number;
}

interface MatchResponse {
  success: boolean;
  client_id: string;
  matches: PropertyMatch[];
  intent_score: number;
  recommendations: string[];
  market_insights: any[];
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

    // Parse request body
    const body: MatchRequest = await req.json()
    const { client_id, refresh_score = false, max_results = 10, min_score = 70 } = body

    if (!client_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Client ID is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch client details
    const { data: client, error: clientError } = await supabase
      .from('ai_clients')
      .select('*')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Client not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch available properties
    const { data: properties, error: propertiesError } = await supabase
      .from('ai_properties')
      .select('*')
      .eq('status', 'available')

    if (propertiesError) {
      throw propertiesError
    }

    // Calculate or fetch intent score
    let intentScore = 3 // Default score
    
    if (refresh_score) {
      // Calculate new intent score
      intentScore = await calculateClientIntentScore(client, supabase)
      
      // Store the new score
      await supabase
        .from('ai_client_intent_scores')
        .upsert({
          client_id: client_id,
          overall_score: intentScore,
          calculated_at: new Date().toISOString()
        })
    } else {
      // Try to get existing score
      const { data: existingScore } = await supabase
        .from('ai_client_intent_scores')
        .select('overall_score')
        .eq('client_id', client_id)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single()
      
      if (existingScore) {
        intentScore = existingScore.overall_score
      }
    }

    // Get previously sent properties
    const { data: previousMatches } = await supabase
      .from('ai_property_matches')
      .select('property_id')
      .eq('client_id', client_id)
      .eq('was_sent', true)

    const previousPropertyIds = previousMatches?.map(m => m.property_id) || []

    // Calculate property matches
    const matches = calculatePropertyMatches(client, properties, previousPropertyIds, min_score)
    
    // Limit results
    const limitedMatches = matches.slice(0, max_results)

    // Store the matches in database
    for (const match of limitedMatches) {
      await supabase
        .from('ai_property_matches')
        .upsert({
          client_id: client_id,
          property_id: match.property_id,
          match_score: match.match_score,
          match_reasons: match.match_reasons,
          created_at: new Date().toISOString()
        })
    }

    // Generate recommendations based on matches and intent score
    const recommendations = generateRecommendations(limitedMatches, intentScore, client)

    // Get relevant market insights
    const { data: marketInsights } = await supabase
      .from('ai_market_insights')
      .select('*')
      .eq('is_active', true)
      .or(`area.eq.${client.preferences?.preferred_areas?.[0] || 'any'},property_type.eq.${client.preferences?.property_types?.[0] || 'any'}`)
      .order('confidence_score', { ascending: false })
      .limit(3)

    const executionTime = Date.now() - startTime

    // Log the operation
    await supabase
      .from('ai_engine_logs')
      .insert({
        operation: 'client_property_matching',
        input_data: { client_id, max_results, min_score },
        output_data: { 
          matches_count: limitedMatches.length,
          intent_score: intentScore,
          recommendations_count: recommendations.length
        },
        execution_time_ms: executionTime,
        status: 'success'
      })

    const response: MatchResponse = {
      success: true,
      client_id: client_id,
      matches: limitedMatches,
      intent_score: intentScore,
      recommendations,
      market_insights: marketInsights || [],
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
    console.error('AI Match Error:', error)

    // Log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      await supabase
        .from('ai_engine_logs')
        .insert({
          operation: 'client_property_matching',
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

// Calculate client intent score based on activity and preferences
async function calculateClientIntentScore(client: any, supabase: any): Promise<number> {
  try {
    // Base score
    let score = 3

    // Check client preferences completeness
    const preferences = client.preferences || {}
    let completenessScore = 0
    
    if (preferences.min_price && preferences.max_price) completenessScore += 1
    if (preferences.property_types && preferences.property_types.length > 0) completenessScore += 1
    if (preferences.preferred_areas && preferences.preferred_areas.length > 0) completenessScore += 1
    if (preferences.min_area || preferences.max_area) completenessScore += 1
    if (preferences.bedrooms || preferences.bathrooms) completenessScore += 1

    // Adjust score based on completeness (0-5 criteria)
    score += (completenessScore - 2.5) * 0.4 // Normalize to +/- 1 point

    // Check recent activity
    const { data: recentInteractions } = await supabase
      .from('ai_client_interactions')
      .select('*')
      .eq('client_id', client.id)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('date', { ascending: false })

    const interactionCount = recentInteractions?.length || 0
    
    // High activity = higher score
    if (interactionCount >= 5) score += 1
    else if (interactionCount >= 3) score += 0.5
    else if (interactionCount === 0) score -= 1

    // Check responsiveness to previous matches
    const { data: previousMatches } = await supabase
      .from('ai_property_matches')
      .select('*')
      .eq('client_id', client.id)
      .eq('was_sent', true)
      .not('client_response', 'is', null)

    const responseRate = previousMatches?.length > 0 
      ? (previousMatches.filter(m => m.client_response !== 'not_interested').length / previousMatches.length)
      : 0.5

    score += (responseRate - 0.5) * 2 // +/- 1 point based on response rate

    // Account recency
    const accountAge = Date.now() - new Date(client.created_at).getTime()
    const daysOld = accountAge / (1000 * 60 * 60 * 24)
    
    // New clients get slight boost, very old inactive clients get penalty
    if (daysOld < 7) score += 0.3
    else if (daysOld > 90 && interactionCount === 0) score -= 0.5

    // Ensure score is within bounds
    return Math.max(1, Math.min(5, Math.round(score)))

  } catch (error) {
    console.error('Error calculating intent score:', error)
    return 3 // Default score on error
  }
}

// Calculate property matches for a client
function calculatePropertyMatches(
  client: any, 
  properties: any[], 
  previousPropertyIds: string[], 
  minScore: number
): PropertyMatch[] {
  const matches: PropertyMatch[] = []
  const preferences = client.preferences || {}

  for (const property of properties) {
    // Skip if already sent
    if (previousPropertyIds.includes(property.id)) continue

    const matchScore = calculateMatchScore(client, property)
    
    if (matchScore >= minScore) {
      matches.push({
        property_id: property.id,
        property: property,
        match_score: matchScore,
        match_reasons: generateMatchReasons(client, property, matchScore),
        confidence: Math.min(0.95, matchScore / 100 + 0.1)
      })
    }
  }

  // Sort by match score descending
  return matches.sort((a, b) => b.match_score - a.match_score)
}

// Calculate match score between client and property
function calculateMatchScore(client: any, property: any): number {
  const preferences = client.preferences || {}
  let totalScore = 0
  let maxScore = 0

  // Price matching (25% weight)
  const priceWeight = 25
  maxScore += priceWeight
  
  if (preferences.min_price && preferences.max_price && property.price) {
    if (property.price >= preferences.min_price && property.price <= preferences.max_price) {
      totalScore += priceWeight
    } else {
      // Partial score for close prices
      const midPrice = (preferences.min_price + preferences.max_price) / 2
      const priceRange = preferences.max_price - preferences.min_price
      const priceDiff = Math.abs(property.price - midPrice)
      const priceScore = Math.max(0, priceWeight * (1 - priceDiff / priceRange))
      totalScore += priceScore
    }
  } else {
    totalScore += priceWeight * 0.5 // Neutral score if no price preference
  }

  // Property type matching (25% weight)
  const typeWeight = 25
  maxScore += typeWeight
  
  if (preferences.property_types && preferences.property_types.includes(property.type)) {
    totalScore += typeWeight
  } else if (preferences.property_types && preferences.property_types.length > 0) {
    // Check for similar types
    const residentialTypes = ['apartment', 'villa', 'house']
    const commercialTypes = ['office', 'warehouse', 'shop']
    
    const clientLikesResidential = preferences.property_types.some((t: string) => residentialTypes.includes(t))
    const clientLikesCommercial = preferences.property_types.some((t: string) => commercialTypes.includes(t))
    const propertyIsResidential = residentialTypes.includes(property.type)
    const propertyIsCommercial = commercialTypes.includes(property.type)
    
    if ((clientLikesResidential && propertyIsResidential) || (clientLikesCommercial && propertyIsCommercial)) {
      totalScore += typeWeight * 0.7
    }
  } else {
    totalScore += typeWeight * 0.5 // Neutral score if no type preference
  }

  // Area/Location matching (25% weight)
  const locationWeight = 25
  maxScore += locationWeight
  
  const propertyLocation = property.location || {}
  const preferredAreas = preferences.preferred_areas || []
  
  if (preferredAreas.length > 0) {
    const locationMatch = preferredAreas.some((area: string) => 
      propertyLocation.area?.toLowerCase().includes(area.toLowerCase()) ||
      propertyLocation.district?.toLowerCase().includes(area.toLowerCase()) ||
      propertyLocation.city?.toLowerCase().includes(area.toLowerCase())
    )
    
    if (locationMatch) {
      totalScore += locationWeight
    } else {
      // Partial match for nearby areas
      totalScore += locationWeight * 0.3
    }
  } else {
    totalScore += locationWeight * 0.5 // Neutral score if no area preference
  }

  // Size matching (15% weight)
  const sizeWeight = 15
  maxScore += sizeWeight
  
  if (preferences.min_area && preferences.max_area && property.area) {
    if (property.area >= preferences.min_area && property.area <= preferences.max_area) {
      totalScore += sizeWeight
    } else {
      // Partial score for close sizes
      const midSize = (preferences.min_area + preferences.max_area) / 2
      const sizeRange = preferences.max_area - preferences.min_area
      const sizeDiff = Math.abs(property.area - midSize)
      const sizeScore = Math.max(0, sizeWeight * (1 - sizeDiff / sizeRange))
      totalScore += sizeScore
    }
  } else {
    totalScore += sizeWeight * 0.5 // Neutral score if no size preference
  }

  // Features matching (10% weight)
  const featuresWeight = 10
  maxScore += featuresWeight
  
  const propertyFeatures = property.features || {}
  let featureMatches = 0
  let totalFeatureChecks = 0
  
  if (preferences.bedrooms && propertyFeatures.bedrooms) {
    totalFeatureChecks++
    if (propertyFeatures.bedrooms >= preferences.bedrooms) featureMatches++
  }
  
  if (preferences.bathrooms && propertyFeatures.bathrooms) {
    totalFeatureChecks++
    if (propertyFeatures.bathrooms >= preferences.bathrooms) featureMatches++
  }
  
  if (totalFeatureChecks > 0) {
    totalScore += featuresWeight * (featureMatches / totalFeatureChecks)
  } else {
    totalScore += featuresWeight * 0.5
  }

  return Math.round((totalScore / maxScore) * 100)
}

// Generate match reasons for a property
function generateMatchReasons(client: any, property: any, score: number): string[] {
  const reasons: string[] = []
  const preferences = client.preferences || {}

  // Price match
  if (preferences.min_price && preferences.max_price && property.price) {
    if (property.price >= preferences.min_price && property.price <= preferences.max_price) {
      reasons.push('السعر ضمن الميزانية المطلوبة')
    }
  }

  // Type match
  if (preferences.property_types && preferences.property_types.includes(property.type)) {
    reasons.push('نوع العقار يطابق التفضيلات')
  }

  // Location match
  const propertyLocation = property.location || {}
  const preferredAreas = preferences.preferred_areas || []
  
  if (preferredAreas.length > 0) {
    const locationMatch = preferredAreas.some((area: string) => 
      propertyLocation.area?.toLowerCase().includes(area.toLowerCase()) ||
      propertyLocation.district?.toLowerCase().includes(area.toLowerCase())
    )
    
    if (locationMatch) {
      reasons.push('الموقع في المنطقة المفضلة')
    }
  }

  // Size match
  if (preferences.min_area && preferences.max_area && property.area) {
    if (property.area >= preferences.min_area && property.area <= preferences.max_area) {
      reasons.push('المساحة مناسبة للمتطلبات')
    }
  }

  // Feature matches
  const propertyFeatures = property.features || {}
  
  if (preferences.bedrooms && propertyFeatures.bedrooms && propertyFeatures.bedrooms >= preferences.bedrooms) {
    reasons.push('عدد غرف النوم مناسب')
  }
  
  if (preferences.bathrooms && propertyFeatures.bathrooms && propertyFeatures.bathrooms >= preferences.bathrooms) {
    reasons.push('عدد الحمامات مناسب')
  }

  // Overall score based reasons
  if (score >= 90) {
    reasons.push('تطابق ممتاز مع جميع المتطلبات')
  } else if (score >= 80) {
    reasons.push('تطابق جيد مع معظم المتطلبات')
  }

  return reasons
}

// Generate recommendations based on matches and intent score
function generateRecommendations(matches: PropertyMatch[], intentScore: number, client: any): string[] {
  const recommendations: string[] = []

  if (matches.length === 0) {
    recommendations.push('لم نجد عقارات تطابق معايير البحث الحالية')
    recommendations.push('يُنصح بتوسيع معايير البحث أو تعديل الميزانية')
    return recommendations
  }

  // High intent score recommendations
  if (intentScore >= 4) {
    recommendations.push('العميل يظهر اهتماماً عالياً - يُنصح بالتواصل الفوري')
    
    const topMatches = matches.filter(m => m.match_score >= 85)
    if (topMatches.length > 0) {
      recommendations.push(`إرسال ${Math.min(3, topMatches.length)} عقارات بتطابق عالي فوراً`)
      recommendations.push('ترتيب موعد معاينة في أقرب وقت ممكن')
    }
  }

  // Medium intent score recommendations  
  else if (intentScore >= 3) {
    recommendations.push('العميل يظهر اهتماماً متوسط - متابعة منتظمة مطلوبة')
    
    if (matches.length >= 3) {
      recommendations.push('إرسال أفضل 3 خيارات مع شرح مفصل لكل عقار')
      recommendations.push('المتابعة خلال 2-3 أيام لمعرفة الرأي')
    }
  }

  // Low intent score recommendations
  else {
    recommendations.push('العميل يحتاج تطوير الاهتمام - تركيز على بناء الثقة')
    recommendations.push('إرسال خيار واحد متميز مع معلومات شاملة')
    recommendations.push('التركيز على فهم احتياجات العميل أكثر')
  }

  // Property-specific recommendations
  const excellentMatches = matches.filter(m => m.match_score >= 90)
  if (excellentMatches.length > 0) {
    recommendations.push(`${excellentMatches.length} عقار/عقارات بتطابق ممتاز (90%+)`)
  }

  const goodMatches = matches.filter(m => m.match_score >= 80 && m.match_score < 90)
  if (goodMatches.length > 0) {
    recommendations.push(`${goodMatches.length} عقار/عقارات بتطابق جيد (80-89%)`)
  }

  return recommendations
}