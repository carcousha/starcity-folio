/**
 * 📊 خدمة التحليلات التنبؤية بالذكاء الاصطناعي
 */

import { Client, Property, PropertyType } from '../types/ai';

export interface MarketPrediction {
  id: string;
  area: string;
  property_type: PropertyType;
  prediction_type: 'price_trend' | 'demand_forecast';
  timeframe: '1_month' | '3_months' | '6_months' | '1_year';
  current_value: number;
  predicted_value: number;
  change_percentage: number;
  confidence_level: number;
  factors: string[];
  created_at: string;
}

export interface ClientBehaviorPrediction {
  client_id: string;
  probability_to_buy: number;
  estimated_budget: number;
  preferred_timeframe: string;
  likely_property_types: PropertyType[];
  conversion_probability: number;
  optimal_contact_time: string;
  predicted_actions: string[];
  confidence: number;
}

export class AIPredictiveAnalytics {
  private cache: Map<string, any> = new Map();

  async predictMarketTrends(
    area: string,
    propertyType: PropertyType,
    timeframe: MarketPrediction['timeframe'] = '6_months'
  ): Promise<MarketPrediction[]> {
    const predictions: MarketPrediction[] = [];

    const pricePrediction = {
      id: `price_${Date.now()}`,
      area,
      property_type: propertyType,
      prediction_type: 'price_trend' as const,
      timeframe,
      current_value: 1000000,
      predicted_value: 1050000,
      change_percentage: 5.0,
      confidence_level: 0.78,
      factors: ['Market trends', 'Economic indicators'],
      created_at: new Date().toISOString()
    };

    predictions.push(pricePrediction);
    return predictions;
  }

  async predictClientBehavior(client: Client): Promise<ClientBehaviorPrediction> {
    const probabilityToBuy = this.calculateBuyingProbability(client);
    
    return {
      client_id: client.id,
      probability_to_buy: probabilityToBuy,
      estimated_budget: this.estimateClientBudget(client),
      preferred_timeframe: this.estimateTimeframe(client),
      likely_property_types: client.property_type.length > 0 ? client.property_type : ['apartment'],
      conversion_probability: probabilityToBuy * 0.8,
      optimal_contact_time: 'afternoon',
      predicted_actions: this.predictNextActions(client, probabilityToBuy),
      confidence: 0.75
    };
  }

  private calculateBuyingProbability(client: Client): number {
    let probability = 0.3;
    
    if (client.budget_min && client.budget_max) probability += 0.2;
    if (client.preferred_area.length > 0) probability += 0.1;
    probability += (client.urgency_level - 3) * 0.1;
    
    return Math.max(0, Math.min(1, probability));
  }

  private estimateClientBudget(client: Client): number {
    if (client.budget_min && client.budget_max) {
      return (client.budget_min + client.budget_max) / 2;
    }
    return 500000;
  }

  private estimateTimeframe(client: Client): string {
    if (client.urgency_level >= 4) return 'خلال شهر';
    if (client.urgency_level >= 3) return 'خلال 3 أشهر';
    return 'خلال 6 أشهر';
  }

  private predictNextActions(client: Client, probability: number): string[] {
    const actions: string[] = [];
    
    if (probability > 0.7) {
      actions.push('إرسال العقارات المتاحة فوراً');
      actions.push('ترتيب موعد معاينة');
    } else {
      actions.push('بناء الثقة والعلاقة');
      actions.push('تقديم محتوى تعليمي');
    }
    
    return actions;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const defaultPredictiveAnalytics = new AIPredictiveAnalytics();