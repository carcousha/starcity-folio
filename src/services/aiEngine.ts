// @ts-nocheck
import { 
  Client, 
  Property, 
  PropertyMatch, 
  ClientIntentScore, 
  BrokerRecommendation, 
  MarketInsight,
  AIEngineConfig,
  AIAnalysisResult,
  PropertyType
} from '../types/ai';

/**
 * محرك الذكاء الاصطناعي لنظام إدارة العقارات والـ CRM
 * يقوم بتحليل البيانات وتقديم التوصيات الذكية
 */
export class AIEngine {
  private config: AIEngineConfig;
  private cache: Map<string, any> = new Map();

  constructor(config?: Partial<AIEngineConfig>) {
    this.config = {
      id: 'default',
      name: 'AI Engine Default',
      description: 'محرك الذكاء الاصطناعي الأساسي',
      weights: {
        budget: 0.25,
        area: 0.20,
        property_type: 0.20,
        location: 0.20,
        features: 0.10,
        urgency: 0.05
      },
      thresholds: {
        min_match_score: 70,
        high_intent_score: 4,
        follow_up_days: 3,
        market_analysis_frequency: 7
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * 🧠 محرك ترشيح العقارات للعميل
   * يحسب نسبة التوافق بين العميل والعقارات المتاحة
   */
  async findPropertyMatches(
    client: Client, 
    properties: Property[], 
    previouslySentProperties: string[] = []
  ): Promise<PropertyMatch[]> {
    const matches: PropertyMatch[] = [];

    for (const property of properties) {
      if (property.status !== 'available') continue;

      const matchScore = this.calculatePropertyMatchScore(client, property);
      
      if (matchScore >= this.config.thresholds.min_match_score) {
        const previouslySent = previouslySentProperties.includes(property.id);
        
        matches.push({
          property_id: property.id,
          property,
          match_score: matchScore,
          match_reasons: this.generateMatchReasons(client, property, matchScore),
          previously_sent: previouslySent,
          sent_date: previouslySent ? this.getLastSentDate(property.id) : undefined
        });
      }
    }

    // ترتيب العقارات حسب نسبة التوافق (الأعلى أولاً)
    return matches.sort((a, b) => b.match_score - a.match_score);
  }

  /**
   * حساب نسبة التوافق بين العميل والعقار
   */
  private calculatePropertyMatchScore(client: Client, property: Property): number {
    let totalScore = 0;
    let maxPossibleScore = 0;

    // 1. الميزانية (25%)
    const budgetScore = this.calculateBudgetScore(client, property);
    totalScore += budgetScore * this.config.weights.budget;
    maxPossibleScore += 100 * this.config.weights.budget;

    // 2. المساحة (20%)
    const areaScore = this.calculateAreaScore(client, property);
    totalScore += areaScore * this.config.weights.area;
    maxPossibleScore += 100 * this.config.weights.area;

    // 3. نوع العقار (20%)
    const propertyTypeScore = this.calculatePropertyTypeScore(client, property);
    totalScore += propertyTypeScore * this.config.weights.property_type;
    maxPossibleScore += 100 * this.config.weights.property_type;

    // 4. الموقع (20%)
    const locationScore = this.calculateLocationScore(client, property);
    totalScore += locationScore * this.config.weights.location;
    maxPossibleScore += 100 * this.config.weights.location;

    // 5. الميزات (10%)
    const featuresScore = this.calculateFeaturesScore(client, property);
    totalScore += featuresScore * this.config.weights.features;
    maxPossibleScore += 100 * this.config.weights.features;

    // 6. مستوى الإلحاح (5%)
          const urgencyScore = this.calculateUrgencyScoreForProperty(client, property);
    totalScore += urgencyScore * this.config.weights.urgency;
    maxPossibleScore += 100 * this.config.weights.urgency;

    return Math.round((totalScore / maxPossibleScore) * 100);
  }

  private calculateBudgetScore(client: Client, property: Property): number {
    const avgBudget = (client.budget_min + client.budget_max) / 2;
    const budgetDiff = Math.abs(property.price - avgBudget);
    const budgetRange = client.budget_max - client.budget_min;

    if (property.price >= client.budget_min && property.price <= client.budget_max) {
      return 100; // ضمن الميزانية المطلوبة
    } else if (budgetDiff <= budgetRange * 0.2) {
      return 80; // قريب من الميزانية
    } else if (budgetDiff <= budgetRange * 0.5) {
      return 60; // متوسط القرب
    } else {
      return Math.max(0, 100 - (budgetDiff / avgBudget) * 100);
    }
  }

  private calculateAreaScore(client: Client, property: Property): number {
    if (!client.area_min && !client.area_max) return 70; // لا يوجد تفضيل محدد

    const clientAreaMin = client.area_min || 0;
    const clientAreaMax = client.area_max || Infinity;

    if (property.area >= clientAreaMin && property.area <= clientAreaMax) {
      return 100;
    } else if (property.area >= clientAreaMin * 0.8 && property.area <= clientAreaMax * 1.2) {
      return 80;
    } else {
      return Math.max(0, 100 - Math.abs(property.area - (clientAreaMin + clientAreaMax) / 2) / 100);
    }
  }

  private calculatePropertyTypeScore(client: Client, property: Property): number {
    if (client.property_type.includes(property.property_type)) {
      return 100;
    } else if (this.isSimilarPropertyType(client.property_type, property.property_type)) {
      return 70;
    } else {
      return 30;
    }
  }

  private isSimilarPropertyType(clientTypes: PropertyType[], propertyType: PropertyType): boolean {
    const residentialTypes = ['villa', 'apartment', 'building'];
    const commercialTypes = ['office', 'warehouse', 'shop'];
    
    const clientHasResidential = clientTypes.some(type => residentialTypes.includes(type));
    const clientHasCommercial = clientTypes.some(type => commercialTypes.includes(type));
    const propertyIsResidential = residentialTypes.includes(propertyType);
    const propertyIsCommercial = commercialTypes.includes(propertyType);

    return (clientHasResidential && propertyIsResidential) || 
           (clientHasCommercial && propertyIsCommercial);
  }

  private calculateLocationScore(client: Client, property: Property): number {
    const clientAreas = client.preferred_area.map(area => area.toLowerCase());
    const propertyArea = property.area_name.toLowerCase();
    const propertyDistrict = property.district.toLowerCase();
    const propertyCity = property.city.toLowerCase();

    if (clientAreas.some(area => 
      propertyArea.includes(area) || 
      propertyDistrict.includes(area) || 
      propertyCity.includes(area)
    )) {
      return 100;
    } else if (clientAreas.some(area => 
      propertyArea.includes(area.substring(0, 3)) || 
      propertyDistrict.includes(area.substring(0, 3))
    )) {
      return 70;
    } else {
      return 40;
    }
  }

  private calculateFeaturesScore(client: Client, property: Property): number {
    if (!client.bedrooms_min && !client.bathrooms_min) return 70;

    let score = 0;
    let totalChecks = 0;

    if (client.bedrooms_min) {
      totalChecks++;
      if (property.bedrooms >= client.bedrooms_min) {
        score += 100;
      } else {
        score += Math.max(0, (property.bedrooms / client.bedrooms_min) * 100);
      }
    }

    if (client.bathrooms_min) {
      totalChecks++;
      if (property.bathrooms >= client.bathrooms_min) {
        score += 100;
      } else {
        score += Math.max(0, (property.bathrooms / client.bathrooms_min) * 100);
      }
    }

    return totalChecks > 0 ? score / totalChecks : 70;
  }

  private calculateUrgencyScoreForProperty(client: Client, property: Property): number {
    const urgencyMultiplier = client.urgency_level / 5;
    return Math.round(70 + (urgencyMultiplier * 30));
  }

  private generateMatchReasons(client: Client, property: Property, score: number): string[] {
    const reasons: string[] = [];

    if (property.price >= client.budget_min && property.price <= client.budget_max) {
      reasons.push('ضمن الميزانية المطلوبة');
    }

    if (client.preferred_area.some(area => 
      property.area_name.toLowerCase().includes(area.toLowerCase())
    )) {
      reasons.push('في المنطقة المفضلة');
    }

    if (client.property_type.includes(property.property_type)) {
      reasons.push('نوع العقار المطلوب');
    }

    if (client.area_min && property.area >= client.area_min) {
      reasons.push('المساحة مناسبة');
    }

    if (client.bedrooms_min && property.bedrooms >= client.bedrooms_min) {
      reasons.push('عدد الغرف مناسب');
    }

    if (score >= 90) {
      reasons.push('تطابق عالي مع المتطلبات');
    } else if (score >= 80) {
      reasons.push('تطابق جيد مع المتطلبات');
    }

    return reasons;
  }

  /**
   * 📊 تقييم مستوى جدية العميل
   */
  async calculateClientIntentScore(client: Client): Promise<ClientIntentScore> {
    const contactFrequencyScore = this.calculateContactFrequencyScore(client);
    const urgencyScore = this.calculateUrgencyScore(client);
    const clarityScore = this.calculateClarityScore(client);
    const interactionScore = this.calculateInteractionScore(client);

    const overallScore = Math.round(
      (contactFrequencyScore + urgencyScore + clarityScore + interactionScore) / 4
    );

    const factors = this.analyzeIntentFactors(client, {
      contactFrequencyScore,
      urgencyScore,
      clarityScore,
      interactionScore
    });

    return {
      client_id: client.id,
      overall_score: overallScore as 1 | 2 | 3 | 4 | 5,
      contact_frequency_score: contactFrequencyScore,
      urgency_score: urgencyScore,
      clarity_score: clarityScore,
      interaction_score: interactionScore,
      last_calculated: new Date().toISOString(),
      factors
    };
  }

  private calculateContactFrequencyScore(client: Client): number {
    const daysSinceCreation = this.getDaysDifference(client.created_at);
    const contactsPerWeek = client.contact_frequency / (daysSinceCreation / 7);

    if (contactsPerWeek >= 3) return 5;
    if (contactsPerWeek >= 2) return 4;
    if (contactsPerWeek >= 1) return 3;
    if (contactsPerWeek >= 0.5) return 2;
    return 1;
  }

  private calculateUrgencyScore(client: Client): number {
    return client.urgency_level;
  }

  private calculateClarityScore(client: Client): number {
    let score = 3; // متوسط افتراضي

    if (client.budget_min && client.budget_max) score += 1;
    if (client.preferred_area.length > 0) score += 1;
    if (client.property_type.length > 0) score += 1;
    if (client.area_min || client.area_max) score += 1;
    if (client.bedrooms_min || client.bathrooms_min) score += 1;

    return Math.min(5, score);
  }

  private calculateInteractionScore(client: Client): number {
    if (client.interaction_score >= 0.8) return 5;
    if (client.interaction_score >= 0.6) return 4;
    if (client.interaction_score >= 0.4) return 3;
    if (client.interaction_score >= 0.2) return 2;
    return 1;
  }

  private analyzeIntentFactors(client: Client, scores: any) {
    const positive: string[] = [];
    const negative: string[] = [];

    if (scores.contactFrequencyScore >= 4) {
      positive.push('تواصل متكرر مع العميل');
    } else if (scores.contactFrequencyScore <= 2) {
      negative.push('تواصل محدود مع العميل');
    }

    if (scores.urgencyScore >= 4) {
      positive.push('مستوى إلحاح عالي');
    } else if (scores.urgencyScore <= 2) {
      negative.push('مستوى إلحاح منخفض');
    }

    if (scores.clarityScore >= 4) {
      positive.push('متطلبات واضحة ومحددة');
    } else if (scores.clarityScore <= 2) {
      negative.push('متطلبات غير واضحة');
    }

    if (scores.interactionScore >= 4) {
      positive.push('تفاعل جيد مع العروض');
    } else if (scores.interactionScore <= 2) {
      negative.push('تفاعل ضعيف مع العروض');
    }

    return { positive, negative };
  }

  /**
   * 🧭 توليد توصيات ذكية للبروكر
   */
  async generateBrokerRecommendations(
    clients: Client[],
    properties: Property[],
    followUpThreshold: number = this.config.thresholds.follow_up_days
  ): Promise<BrokerRecommendation[]> {
    const recommendations: BrokerRecommendation[] = [];

    // 1. توصيات المتابعة
    const followUpRecommendations = this.generateFollowUpRecommendations(clients, followUpThreshold);
    recommendations.push(...followUpRecommendations);

    // 2. توصيات تطابق العقارات
    const propertyMatchRecommendations = this.generatePropertyMatchRecommendations(clients, properties);
    recommendations.push(...propertyMatchRecommendations);

    // 3. توصيات تعيين البروكر
    const brokerAssignmentRecommendations = this.generateBrokerAssignmentRecommendations(clients);
    recommendations.push(...brokerAssignmentRecommendations);

    return recommendations.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));
  }

  private generateFollowUpRecommendations(clients: Client[], threshold: number): BrokerRecommendation[] {
    const recommendations: BrokerRecommendation[] = [];
    const now = new Date();

    for (const client of clients) {
      if (client.status !== 'active') continue;

      const daysSinceLastContact = this.getDaysDifference(client.last_contact_date);
      
      if (daysSinceLastContact >= threshold) {
        recommendations.push({
          id: `follow_up_${client.id}_${Date.now()}`,
          type: 'follow_up',
          priority: daysSinceLastContact >= threshold * 2 ? 'urgent' : 'high',
          title: `متابعة عميل: ${client.full_name}`,
          message: `لم يتم التواصل مع العميل ${client.full_name} منذ ${daysSinceLastContact} أيام. يرجى المتابعة.`,
          client_id: client.id,
          created_at: now.toISOString(),
          is_read: false,
          action_required: true,
          action_deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // غداً
        });
      }
    }

    return recommendations;
  }

  private generatePropertyMatchRecommendations(clients: Client[], properties: Property[]): BrokerRecommendation[] {
    const recommendations: BrokerRecommendation[] = [];
    const availableProperties = properties.filter(p => p.status === 'available');

    for (const client of clients) {
      if (client.status !== 'active') continue;

      const highMatchProperties = availableProperties.filter(property => {
        const score = this.calculatePropertyMatchScore(client, property);
        return score >= 85; // عقارات بتطابق عالي
      });

      if (highMatchProperties.length > 0) {
        const bestMatch = highMatchProperties[0];
        recommendations.push({
          id: `property_match_${client.id}_${bestMatch.id}_${Date.now()}`,
          type: 'property_match',
          priority: 'medium',
          title: `عقار مناسب للعميل: ${client.full_name}`,
          message: `تم العثور على عقار مناسب للعميل ${client.full_name} بنسبة تطابق ${Math.round(this.calculatePropertyMatchScore(client, bestMatch))}%`,
          client_id: client.id,
          property_id: bestMatch.id,
          created_at: new Date().toISOString(),
          is_read: false,
          action_required: true
        });
      }
    }

    return recommendations;
  }

  private generateBrokerAssignmentRecommendations(clients: Client[]): BrokerRecommendation[] {
    const recommendations: BrokerRecommendation[] = [];

    for (const client of clients) {
      if (client.status !== 'active' || client.assigned_broker_id) continue;

      recommendations.push({
        id: `broker_assignment_${client.id}_${Date.now()}`,
        type: 'broker_assignment',
        priority: 'medium',
        title: `تعيين بروكر للعميل: ${client.full_name}`,
        message: `العميل ${client.full_name} يحتاج إلى تعيين بروكر مناسب.`,
        client_id: client.id,
        created_at: new Date().toISOString(),
        is_read: false,
        action_required: true
      });
    }

    return recommendations;
  }

  private getPriorityScore(priority: string): number {
    switch (priority) {
      case 'urgent': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  /**
   * 🧮 تحليل اتجاهات السوق
   */
  async analyzeMarketTrends(properties: Property[]): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = [];
    const now = new Date();

    // تجميع البيانات حسب المنطقة ونوع العقار
    const marketData = this.aggregateMarketData(properties);

    for (const [area, areaData] of Object.entries(marketData)) {
      for (const [propertyType, typeData] of Object.entries(areaData)) {
        const insight = this.generateMarketInsight(area, propertyType as PropertyType, typeData, now);
        if (insight) {
          insights.push(insight);
        }
      }
    }

    return insights;
  }

  private aggregateMarketData(properties: Property[]) {
    const marketData: Record<string, Record<string, any>> = {};

    for (const property of properties) {
      if (!marketData[property.area_name]) {
        marketData[property.area_name] = {};
      }

      if (!marketData[property.area_name][property.property_type]) {
        marketData[property.area_name][property.property_type] = {
          properties: [],
          totalPrice: 0,
          totalArea: 0,
          daysOnMarket: []
        };
      }

      const data = marketData[property.area_name][property.property_type];
      data.properties.push(property);
      data.totalPrice += property.price;
      data.totalArea += property.area;

      if (property.status === 'available') {
        const daysOnMarket = this.getDaysDifference(property.listed_date);
        data.daysOnMarket.push(daysOnMarket);
      }
    }

    return marketData;
  }

  private generateMarketInsight(
    area: string, 
    propertyType: PropertyType, 
    data: any, 
    now: Date
  ): MarketInsight | null {
    const avgPrice = data.totalPrice / data.properties.length;
    const avgArea = data.totalArea / data.properties.length;
    const availableCount = data.properties.filter((p: Property) => p.status === 'available').length;
    const totalCount = data.properties.length;
    const avgDaysOnMarket = data.daysOnMarket.length > 0 
      ? data.daysOnMarket.reduce((a: number, b: number) => a + b, 0) / data.daysOnMarket.length 
      : 0;

    // تحديد مستوى العرض والطلب
    const supplyLevel = this.determineSupplyLevel(availableCount, totalCount);
    const demandLevel = this.determineDemandLevel(avgDaysOnMarket, availableCount);
    const priceTrend = this.determinePriceTrend(data.properties);

    // إنشاء الرؤية فقط إذا كانت هناك بيانات كافية
    if (totalCount < 3) return null;

    const insightType = this.determineInsightType(supplyLevel, demandLevel, priceTrend);
    const confidenceScore = this.calculateConfidenceScore(totalCount, availableCount);

    return {
      id: `insight_${area}_${propertyType}_${Date.now()}`,
      insight_type: insightType,
      title: this.generateInsightTitle(insightType, area, propertyType),
      description: this.generateInsightDescription(insightType, area, propertyType, {
        avgPrice,
        avgArea,
        supplyLevel,
        demandLevel,
        priceTrend,
        avgDaysOnMarket
      }),
      data: {
        area,
        property_type: propertyType,
        avg_price: avgPrice,
        demand_level: demandLevel,
        supply_level: supplyLevel,
        price_trend: priceTrend,
        days_on_market_avg: avgDaysOnMarket
      },
      confidence_score: confidenceScore,
      created_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // صالح لمدة 30 يوم
    };
  }

  private determineSupplyLevel(availableCount: number, totalCount: number): 'low' | 'medium' | 'high' {
    const ratio = availableCount / totalCount;
    if (ratio <= 0.3) return 'low';
    if (ratio <= 0.7) return 'medium';
    return 'high';
  }

  private determineDemandLevel(avgDaysOnMarket: number, availableCount: number): 'low' | 'medium' | 'high' {
    if (avgDaysOnMarket <= 30) return 'high';
    if (avgDaysOnMarket <= 90) return 'medium';
    return 'low';
  }

  private determinePriceTrend(properties: Property[]): 'increasing' | 'decreasing' | 'stable' {
    if (properties.length < 2) return 'stable';

    const sortedByDate = properties.sort((a, b) => 
      new Date(a.listed_date).getTime() - new Date(b.listed_date).getTime()
    );

    const recentPrices = sortedByDate.slice(-3).map(p => p.price);
    const olderPrices = sortedByDate.slice(0, 3).map(p => p.price);

    if (recentPrices.length === 0 || olderPrices.length === 0) return 'stable';

    const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  private determineInsightType(
    supplyLevel: string, 
    demandLevel: string, 
    priceTrend: string
  ): 'trend' | 'opportunity' | 'warning' | 'analysis' {
    if (demandLevel === 'high' && supplyLevel === 'low') return 'opportunity';
    if (demandLevel === 'low' && supplyLevel === 'high') return 'warning';
    if (priceTrend !== 'stable') return 'trend';
    return 'analysis';
  }

  private calculateConfidenceScore(totalCount: number, availableCount: number): number {
    let score = 50; // أساسي

    if (totalCount >= 10) score += 20;
    else if (totalCount >= 5) score += 10;

    if (availableCount >= 3) score += 20;
    else if (availableCount >= 1) score += 10;

    return Math.min(100, score);
  }

  private generateInsightTitle(
    insightType: string, 
    area: string, 
    propertyType: string
  ): string {
    const typeNames = {
      villa: 'فيلا',
      apartment: 'شقة',
      land: 'أرض',
      office: 'مكتب',
      warehouse: 'مستودع',
      shop: 'محل',
      building: 'مبنى'
    };

    const typeName = typeNames[propertyType] || propertyType;

    switch (insightType) {
      case 'opportunity':
        return `فرصة استثمارية في ${area} - ${typeName}`;
      case 'warning':
        return `تحذير: عرض زائد في ${area} - ${typeName}`;
      case 'trend':
        return `اتجاه سعري في ${area} - ${typeName}`;
      default:
        return `تحليل السوق في ${area} - ${typeName}`;
    }
  }

  private generateInsightDescription(
    insightType: string, 
    area: string, 
    propertyType: string, 
    data: any
  ): string {
    const typeNames = {
      villa: 'فيلا',
      apartment: 'شقة',
      land: 'أرض',
      office: 'مكتب',
      warehouse: 'مستودع',
      shop: 'محل',
      building: 'مبنى'
    };

    const typeName = typeNames[propertyType] || propertyType;

    switch (insightType) {
      case 'opportunity':
        return `السوق في ${area} يظهر طلباً عالياً على ${typeName} مع عرض محدود. متوسط السعر: ${data.avgPrice.toLocaleString()} ريال. الوقت مناسب للاستثمار.`;
      
      case 'warning':
        return `السوق في ${area} يعاني من عرض زائد على ${typeName} مع طلب منخفض. متوسط السعر: ${data.avgPrice.toLocaleString()} ريال. قد تحتاج إلى تعديل الاستراتيجية.`;
      
      case 'trend':
        return `السوق في ${area} يظهر ${data.priceTrend === 'increasing' ? 'ارتفاعاً' : 'انخفاضاً'} في أسعار ${typeName}. متوسط السعر: ${data.avgPrice.toLocaleString()} ريال.`;
      
      default:
        return `تحليل شامل لسوق ${typeName} في ${area}. متوسط السعر: ${data.avgPrice.toLocaleString()} ريال، متوسط المساحة: ${Math.round(data.avgArea)} متر مربع.`;
    }
  }

  /**
   * 🔗 ربط الوحدة بالنظام
   */
  async performFullAnalysis(
    client: Client,
    properties: Property[],
    previouslySentProperties: string[] = []
  ): Promise<AIAnalysisResult> {
    const [propertyMatches, intentScore, recommendations, marketInsights] = await Promise.all([
      this.findPropertyMatches(client, properties, previouslySentProperties),
      this.calculateClientIntentScore(client),
      this.generateBrokerRecommendations([client], properties),
      this.analyzeMarketTrends(properties)
    ]);

    const nextBestActions = this.generateNextBestActions(client, intentScore, propertyMatches);

    return {
      client_id: client.id,
      analysis_date: new Date().toISOString(),
      property_matches: propertyMatches,
      intent_score: intentScore,
      recommendations: recommendations.filter(r => r.client_id === client.id),
      market_insights: marketInsights.filter(i => 
        i.data.area === client.preferred_area[0] || 
        i.data.property_type === client.property_type[0]
      ),
      next_best_actions: nextBestActions
    };
  }

  private generateNextBestActions(
    client: Client, 
    intentScore: ClientIntentScore, 
    propertyMatches: PropertyMatch[]
  ): string[] {
    const actions: string[] = [];

    if (intentScore.overall_score >= 4) {
      actions.push('إرسال عروض جديدة للعميل - مستوى جدية عالي');
    } else if (intentScore.overall_score <= 2) {
      actions.push('إعادة تقييم متطلبات العميل - مستوى جدية منخفض');
    }

    if (propertyMatches.length > 0) {
      const highMatches = propertyMatches.filter(m => m.match_score >= 90);
      if (highMatches.length > 0) {
        actions.push(`إرسال ${highMatches.length} عقار بتطابق عالي`);
      }
    }

    if (intentScore.factors.negative.length > 0) {
      actions.push('معالجة العوامل السلبية لتحسين مستوى الجدية');
    }

    if (client.urgency_level >= 4) {
      actions.push('متابعة فورية - العميل في عجلة من أمره');
    }

    return actions;
  }

  /**
   * تحديث إعدادات المحرك
   */
  updateConfig(newConfig: Partial<AIEngineConfig>): void {
    this.config = { ...this.config, ...newConfig, updated_at: new Date().toISOString() };
  }

  /**
   * الحصول على الإعدادات الحالية
   */
  getConfig(): AIEngineConfig {
    return { ...this.config };
  }

  /**
   * مسح الذاكرة المؤقتة
   */
  clearCache(): void {
    this.cache.clear();
  }

  // دوال مساعدة
  private getDaysDifference(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getLastSentDate(propertyId: string): string | undefined {
    // في التطبيق الحقيقي، سيتم استرجاع هذا من قاعدة البيانات
    return new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
  }
}

// تصدير نسخة افتراضية من المحرك
export const defaultAIEngine = new AIEngine();
