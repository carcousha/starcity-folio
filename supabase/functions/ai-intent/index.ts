import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IntentRequest {
  client_id?: string;
  message?: string;
  conversation_context?: any[];
  analyze_all_clients?: boolean;
  broker_id?: string;
}

interface IntentAnalysis {
  client_id: string;
  intent_type: string;
  confidence: number;
  urgency_level: number;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  next_actions: string[];
  priority_score: number;
}

interface IntentResponse {
  success: boolean;
  analysis: IntentAnalysis | IntentAnalysis[];
  recommendations: string[];
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
    const body: IntentRequest = await req.json()
    const { 
      client_id, 
      message, 
      conversation_context = [], 
      analyze_all_clients = false,
      broker_id 
    } = body

    let analysisResults: IntentAnalysis[] = []

    if (analyze_all_clients) {
      // Analyze all clients for a broker or globally
      let clientsQuery = supabase
        .from('ai_clients')
        .select('*')
      
      if (broker_id) {
        clientsQuery = clientsQuery.eq('assigned_broker_id', broker_id)
      }

      const { data: clients, error: clientsError } = await clientsQuery

      if (clientsError) {
        throw clientsError
      }

      // Analyze each client
      for (const client of clients || []) {
        const analysis = await analyzeClientIntent(client, supabase)
        if (analysis) {
          analysisResults.push(analysis)
        }
      }

      // Sort by priority score descending
      analysisResults.sort((a, b) => b.priority_score - a.priority_score)

    } else if (client_id) {
      // Analyze specific client
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

      // If message provided, analyze it first
      let messageIntent = null
      if (message) {
        messageIntent = analyzeMessage(message, conversation_context)
      }

      // Analyze client intent
      const analysis = await analyzeClientIntent(client, supabase, messageIntent)
      if (analysis) {
        analysisResults.push(analysis)
      }

    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Either client_id or analyze_all_clients must be provided' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate global recommendations
    const recommendations = generateGlobalRecommendations(analysisResults)

    const executionTime = Date.now() - startTime

    // Log the operation
    await supabase
      .from('ai_engine_logs')
      .insert({
        operation: 'intent_analysis',
        input_data: { 
          client_id, 
          analyze_all_clients, 
          broker_id,
          has_message: !!message 
        },
        output_data: { 
          clients_analyzed: analysisResults.length,
          high_priority_clients: analysisResults.filter(a => a.priority_score >= 80).length
        },
        execution_time_ms: executionTime,
        status: 'success'
      })

    const response: IntentResponse = {
      success: true,
      analysis: analyze_all_clients ? analysisResults : analysisResults[0],
      recommendations,
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
    console.error('AI Intent Analysis Error:', error)

    // Log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      await supabase
        .from('ai_engine_logs')
        .insert({
          operation: 'intent_analysis',
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

// Analyze message content for intent
function analyzeMessage(message: string, context: any[] = []): any {
  const lowerMessage = message.toLowerCase()
  
  // Arabic and English keywords for different intents
  const intentKeywords = {
    buying: {
      ar: ['شراء', 'اشتري', 'أشتري', 'بشتري', 'إشتري', 'اقتناء', 'حاب اشتري', 'أريد شراء', 'بدي اشتري'],
      en: ['buy', 'purchase', 'buying', 'want to buy', 'looking to buy', 'interested in buying']
    },
    selling: {
      ar: ['بيع', 'ابيع', 'أبيع', 'ببيع', 'عرض للبيع', 'أريد البيع', 'حاب ابيع'],
      en: ['sell', 'selling', 'want to sell', 'looking to sell', 'put on market']
    },
    renting: {
      ar: ['إيجار', 'ايجار', 'استئجار', 'تأجير', 'ايجر', 'اؤجر', 'للإيجار', 'للايجار'],
      en: ['rent', 'rental', 'lease', 'renting', 'for rent', 'to rent']
    },
    viewing: {
      ar: ['معاينة', 'زيارة', 'شوف', 'أشوف', 'اشوف', 'موعد', 'زيارة العقار', 'أريد أشوف'],
      en: ['view', 'visit', 'see', 'appointment', 'viewing', 'tour', 'show me']
    },
    information: {
      ar: ['معلومات', 'تفاصيل', 'أريد معرفة', 'اخبرني', 'وضح لي', 'فهمني', 'ايش رأيك'],
      en: ['information', 'details', 'tell me', 'explain', 'info', 'what about']
    },
    urgent: {
      ar: ['عاجل', 'سريع', 'بسرعة', 'استعجال', 'ضروري', 'مستعجل', 'فوري', 'اليوم'],
      en: ['urgent', 'quickly', 'asap', 'immediately', 'fast', 'today', 'now']
    },
    budget: {
      ar: ['ميزانية', 'سعر', 'كم', 'تكلفة', 'ثمن', 'قيمة', 'فلوس', 'مبلغ'],
      en: ['budget', 'price', 'cost', 'how much', 'money', 'value', 'expensive']
    },
    location: {
      ar: ['موقع', 'منطقة', 'حي', 'مكان', 'أين', 'وين', 'مدينة', 'قريب'],
      en: ['location', 'area', 'where', 'place', 'district', 'neighborhood', 'near']
    }
  }

  // Sentiment keywords
  const sentimentKeywords = {
    positive: {
      ar: ['ممتاز', 'رائع', 'جميل', 'حلو', 'أعجبني', 'أحبه', 'مناسب', 'شكراً', 'مشكور'],
      en: ['excellent', 'great', 'good', 'nice', 'perfect', 'love', 'like', 'thanks', 'amazing']
    },
    negative: {
      ar: ['سيء', 'رديء', 'مش حلو', 'ما يعجبني', 'غالي', 'صعب', 'مشكلة', 'لا يناسبني'],
      en: ['bad', 'terrible', 'expensive', 'problem', 'difficult', 'not good', 'hate', 'dislike']
    }
  }

  let detectedIntent = 'general_inquiry'
  let confidence = 0.5
  let urgencyLevel = 1
  let keywords: string[] = []
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'

  // Detect intent type
  for (const [intent, langs] of Object.entries(intentKeywords)) {
    const allKeywords = [...langs.ar, ...langs.en]
    const foundKeywords = allKeywords.filter(keyword => lowerMessage.includes(keyword))
    
    if (foundKeywords.length > 0) {
      detectedIntent = intent
      confidence = Math.min(0.9, 0.6 + (foundKeywords.length * 0.1))
      keywords.push(...foundKeywords)
      break
    }
  }

  // Check for urgency
  const urgentKeywords = [...intentKeywords.urgent.ar, ...intentKeywords.urgent.en]
  const urgentFound = urgentKeywords.filter(keyword => lowerMessage.includes(keyword))
  if (urgentFound.length > 0) {
    urgencyLevel = Math.min(5, 3 + urgentFound.length)
    keywords.push(...urgentFound)
  }

  // Detect sentiment
  const positiveKeywords = [...sentimentKeywords.positive.ar, ...sentimentKeywords.positive.en]
  const negativeKeywords = [...sentimentKeywords.negative.ar, ...sentimentKeywords.negative.en]
  
  const positiveFound = positiveKeywords.filter(keyword => lowerMessage.includes(keyword))
  const negativeFound = negativeKeywords.filter(keyword => lowerMessage.includes(keyword))
  
  if (positiveFound.length > negativeFound.length) {
    sentiment = 'positive'
  } else if (negativeFound.length > positiveFound.length) {
    sentiment = 'negative'
  }

  return {
    intent_type: detectedIntent,
    confidence,
    urgency_level: urgencyLevel,
    keywords: [...new Set(keywords)],
    sentiment,
    message_length: message.length,
    has_context: context.length > 0
  }
}

// Analyze client intent based on their data and behavior
async function analyzeClientIntent(
  client: any, 
  supabase: any, 
  messageIntent?: any
): Promise<IntentAnalysis | null> {
  try {
    // Get client interactions
    const { data: interactions } = await supabase
      .from('ai_client_interactions')
      .select('*')
      .eq('client_id', client.id)
      .order('date', { ascending: false })
      .limit(10)

    // Get property matches and responses
    const { data: propertyMatches } = await supabase
      .from('ai_property_matches')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get recent conversations
    const { data: conversations } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('client_id', client.id)
      .order('updated_at', { ascending: false })
      .limit(5)

    // Calculate base intent scores
    const activityScore = calculateActivityScore(client, interactions || [])
    const engagementScore = calculateEngagementScore(propertyMatches || [])
    const responseScore = calculateResponseScore(propertyMatches || [])
    const conversationScore = calculateConversationScore(conversations || [])
    
    // Determine primary intent type
    let intentType = 'general_inquiry'
    let confidence = 0.5
    let urgencyLevel = 1
    let keywords: string[] = []
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'

    // Use message intent if available
    if (messageIntent) {
      intentType = messageIntent.intent_type
      confidence = messageIntent.confidence
      urgencyLevel = messageIntent.urgency_level
      keywords = messageIntent.keywords
      sentiment = messageIntent.sentiment
    } else {
      // Infer intent from behavior patterns
      const behaviorIntent = inferIntentFromBehavior(client, interactions || [], propertyMatches || [])
      intentType = behaviorIntent.intent_type
      confidence = behaviorIntent.confidence
      urgencyLevel = behaviorIntent.urgency_level
    }

    // Calculate overall priority score
    const priorityScore = Math.round(
      (activityScore * 0.25) +
      (engagementScore * 0.25) +
      (responseScore * 0.25) +
      (conversationScore * 0.15) +
      (urgencyLevel * 20 * 0.1)
    )

    // Generate next actions
    const nextActions = generateNextActions(
      intentType, 
      priorityScore, 
      urgencyLevel, 
      sentiment,
      client.preferences || {}
    )

    const analysis: IntentAnalysis = {
      client_id: client.id,
      intent_type: intentType,
      confidence: Math.round(confidence * 100) / 100,
      urgency_level: urgencyLevel,
      keywords,
      sentiment,
      next_actions: nextActions,
      priority_score: Math.max(0, Math.min(100, priorityScore))
    }

    // Store the analysis
    await supabase
      .from('ai_client_intent_scores')
      .upsert({
        client_id: client.id,
        overall_score: Math.round(priorityScore / 20), // Convert to 1-5 scale
        contact_frequency_score: activityScore / 100,
        urgency_score: urgencyLevel / 5,
        clarity_score: confidence,
        interaction_score: engagementScore / 100,
        factors: {
          positive: nextActions.filter(action => action.includes('يُنصح') || action.includes('اهتمام')),
          negative: nextActions.filter(action => action.includes('يحتاج') || action.includes('ضعيف'))
        },
        calculated_at: new Date().toISOString()
      })

    return analysis

  } catch (error) {
    console.error('Error analyzing client intent:', error)
    return null
  }
}

// Calculate activity score based on recent interactions
function calculateActivityScore(client: any, interactions: any[]): number {
  if (interactions.length === 0) return 20

  const now = Date.now()
  const accountAge = now - new Date(client.created_at).getTime()
  const daysOld = accountAge / (1000 * 60 * 60 * 24)

  // Recent activity (last 7 days)
  const recentInteractions = interactions.filter(interaction => {
    const interactionAge = now - new Date(interaction.date).getTime()
    return interactionAge <= (7 * 24 * 60 * 60 * 1000)
  })

  let score = 30 // Base score

  // Boost for recent activity
  score += Math.min(40, recentInteractions.length * 10)

  // Consistency bonus
  if (interactions.length >= 3) {
    const dates = interactions.map(i => new Date(i.date).getTime()).sort()
    const avgGap = dates.length > 1 ? (dates[dates.length - 1] - dates[0]) / (dates.length - 1) : 0
    const daysBetween = avgGap / (1000 * 60 * 60 * 24)
    
    if (daysBetween <= 7) score += 20 // Regular engagement
    else if (daysBetween <= 14) score += 10
  }

  // Penalty for very old inactive accounts
  if (daysOld > 90 && recentInteractions.length === 0) {
    score -= 30
  }

  return Math.max(0, Math.min(100, score))
}

// Calculate engagement score based on property interactions
function calculateEngagementScore(propertyMatches: any[]): number {
  if (propertyMatches.length === 0) return 30

  let score = 20 // Base score

  const sentMatches = propertyMatches.filter(m => m.was_sent)
  const respondedMatches = propertyMatches.filter(m => m.client_response)
  const interestedMatches = propertyMatches.filter(m => 
    m.client_response === 'interested' || 
    m.client_response === 'viewed' || 
    m.client_response === 'scheduled_viewing'
  )

  // Response rate
  if (sentMatches.length > 0) {
    const responseRate = respondedMatches.length / sentMatches.length
    score += responseRate * 40
  }

  // Interest rate
  if (respondedMatches.length > 0) {
    const interestRate = interestedMatches.length / respondedMatches.length
    score += interestRate * 30
  }

  // Recent engagement
  const recentMatches = propertyMatches.filter(m => {
    const matchAge = Date.now() - new Date(m.created_at).getTime()
    return matchAge <= (14 * 24 * 60 * 60 * 1000) // Last 14 days
  })

  if (recentMatches.length > 0) {
    score += Math.min(10, recentMatches.length * 2)
  }

  return Math.max(0, Math.min(100, score))
}

// Calculate response score
function calculateResponseScore(propertyMatches: any[]): number {
  const respondedMatches = propertyMatches.filter(m => m.client_response && m.response_at)
  
  if (respondedMatches.length === 0) return 30

  let totalScore = 0
  let scoreCount = 0

  for (const match of respondedMatches) {
    let matchScore = 50 // Base score for responding

    // Response type scoring
    switch (match.client_response) {
      case 'interested':
        matchScore += 40
        break
      case 'viewed':
        matchScore += 35
        break
      case 'scheduled_viewing':
        matchScore += 45
        break
      case 'contacted':
        matchScore += 30
        break
      case 'not_interested':
        matchScore += 10 // Still good that they responded
        break
    }

    // Response speed bonus
    if (match.sent_at && match.response_at) {
      const responseTime = new Date(match.response_at).getTime() - new Date(match.sent_at).getTime()
      const hoursToRespond = responseTime / (1000 * 60 * 60)
      
      if (hoursToRespond <= 2) matchScore += 10
      else if (hoursToRespond <= 24) matchScore += 5
    }

    totalScore += matchScore
    scoreCount++
  }

  return Math.max(0, Math.min(100, totalScore / scoreCount))
}

// Calculate conversation score
function calculateConversationScore(conversations: any[]): number {
  if (conversations.length === 0) return 40

  let score = 30 // Base score

  for (const conv of conversations) {
    // Sentiment bonus
    if (conv.sentiment_score > 0.6) score += 15
    else if (conv.sentiment_score < 0.4) score -= 5

    // Active conversations
    if (conv.status === 'active') score += 10

    // Intent clarity
    if (conv.intent_detected && conv.intent_detected !== 'general_inquiry') {
      score += 10
    }
  }

  return Math.max(0, Math.min(100, score / conversations.length))
}

// Infer intent from behavior patterns
function inferIntentFromBehavior(client: any, interactions: any[], propertyMatches: any[]): any {
  const preferences = client.preferences || {}
  let intentType = 'general_inquiry'
  let confidence = 0.5
  let urgencyLevel = 1

  // Check interaction patterns
  const recentInteractions = interactions.filter(interaction => {
    const interactionAge = Date.now() - new Date(interaction.date).getTime()
    return interactionAge <= (7 * 24 * 60 * 60 * 1000)
  })

  // High activity suggests buying intent
  if (recentInteractions.length >= 3) {
    intentType = 'buying'
    confidence = 0.7
    urgencyLevel = Math.min(5, 2 + Math.floor(recentInteractions.length / 2))
  }

  // Clear preferences suggest serious intent
  const preferencesCount = Object.keys(preferences).length
  if (preferencesCount >= 4) {
    if (intentType === 'general_inquiry') intentType = 'buying'
    confidence = Math.min(0.9, confidence + 0.2)
    urgencyLevel = Math.max(urgencyLevel, 2)
  }

  // Response to property matches
  const interestedMatches = propertyMatches.filter(m => 
    m.client_response === 'interested' || 
    m.client_response === 'viewed' || 
    m.client_response === 'scheduled_viewing'
  )

  if (interestedMatches.length > 0) {
    intentType = 'viewing'
    confidence = 0.8
    urgencyLevel = Math.max(urgencyLevel, 3)
  }

  // Account age factor
  const accountAge = Date.now() - new Date(client.created_at).getTime()
  const daysOld = accountAge / (1000 * 60 * 60 * 24)
  
  if (daysOld < 7 && recentInteractions.length > 0) {
    urgencyLevel = Math.max(urgencyLevel, 3) // New active clients are urgent
  }

  return { intent_type: intentType, confidence, urgency_level: urgencyLevel }
}

// Generate next actions based on analysis
function generateNextActions(
  intentType: string, 
  priorityScore: number, 
  urgencyLevel: number, 
  sentiment: string,
  preferences: any
): string[] {
  const actions: string[] = []

  // Priority-based actions
  if (priorityScore >= 80) {
    actions.push('عميل ذو أولوية عالية - يُنصح بالتواصل الفوري')
    actions.push('ترتيب موعد خلال 24 ساعة')
  } else if (priorityScore >= 60) {
    actions.push('عميل ذو أولوية متوسطة - متابعة خلال 2-3 أيام')
  } else {
    actions.push('عميل يحتاج تطوير الاهتمام - تواصل أسبوعي')
  }

  // Intent-based actions
  switch (intentType) {
    case 'buying':
      actions.push('إرسال أفضل العقارات المطابقة للمعايير')
      if (urgencyLevel >= 4) actions.push('تحضير عروض خاصة')
      break
    
    case 'viewing':
      actions.push('تنسيق مواعيد المعاينة المطلوبة')
      actions.push('تحضير معلومات تفصيلية عن العقارات')
      break
    
    case 'renting':
      actions.push('التركيز على العقارات المتاحة للإيجار')
      actions.push('شرح شروط الإيجار والعمولات')
      break
    
    case 'information':
      actions.push('تقديم معلومات شاملة عن السوق')
      actions.push('شرح عملية الشراء/البيع')
      break
  }

  // Urgency-based actions
  if (urgencyLevel >= 4) {
    actions.push('استجابة عاجلة مطلوبة - خلال ساعات')
    actions.push('تخصيص وقت إضافي للمتابعة')
  }

  // Sentiment-based actions
  if (sentiment === 'positive') {
    actions.push('الاستفادة من الحماس الإيجابي')
    actions.push('تقديم خيارات متنوعة')
  } else if (sentiment === 'negative') {
    actions.push('معالجة المخاوف والشكاوى أولاً')
    actions.push('بناء الثقة قبل عرض العقارات')
  }

  // Preferences-based actions
  if (Object.keys(preferences).length < 3) {
    actions.push('جمع المزيد من المعلومات عن التفضيلات')
    actions.push('إجراء مقابلة تفصيلية')
  }

  return actions
}

// Generate global recommendations
function generateGlobalRecommendations(analyses: IntentAnalysis[]): string[] {
  const recommendations: string[] = []

  if (analyses.length === 0) {
    recommendations.push('لا توجد عملاء للتحليل')
    return recommendations
  }

  const highPriority = analyses.filter(a => a.priority_score >= 80)
  const mediumPriority = analyses.filter(a => a.priority_score >= 60 && a.priority_score < 80)
  const urgent = analyses.filter(a => a.urgency_level >= 4)
  const buying = analyses.filter(a => a.intent_type === 'buying')

  if (highPriority.length > 0) {
    recommendations.push(`${highPriority.length} عميل/عملاء ذوو أولوية عالية يحتاجون تواصل فوري`)
  }

  if (urgent.length > 0) {
    recommendations.push(`${urgent.length} عميل/عملاء يظهرون إلحاح عالي`)
  }

  if (buying.length > 0) {
    recommendations.push(`${buying.length} عميل/عملاء يظهرون نية شراء واضحة`)
  }

  if (mediumPriority.length > 0) {
    recommendations.push(`${mediumPriority.length} عميل/عملاء يحتاجون متابعة منتظمة`)
  }

  // Overall insights
  const avgPriority = analyses.reduce((sum, a) => sum + a.priority_score, 0) / analyses.length
  if (avgPriority >= 70) {
    recommendations.push('مستوى عام عالي من الاهتمام - فرصة جيدة للمبيعات')
  } else if (avgPriority <= 40) {
    recommendations.push('مستوى اهتمام منخفض - التركيز على بناء العلاقات')
  }

  return recommendations
}