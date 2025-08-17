import { supabase } from '@/integrations/supabase/client'

export interface WhatsAppResponse {
  success: boolean
  message: string
  data?: any
}

export interface TestConnectionData {
  sender: string
  number?: string
  message?: string
}

class WhatsAppServiceDirect {
  private async callEdgeFunction(type: string, data: any): Promise<WhatsAppResponse> {
    try {
      console.log(`📤 استدعاء Edge Function مباشر للنوع: ${type}`)
      console.log(`📋 البيانات المرسلة:`, data)
      
      // Get current session to ensure we're authenticated
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.access_token) {
        console.error('❌ لا يوجد جلسة مصادقة')
        return {
          success: false,
          message: 'يجب تسجيل الدخول أولاً'
        }
      }

      const { data: result, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: { type, ...data },
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (error) {
        console.error('❌ خطأ في Edge Function:', error)
        return {
          success: false,
          message: `خطأ في الاتصال: ${error.message || 'مشكلة في الخادم'}`
        }
      }

      console.log('✅ استجابة Edge Function:', result)
      return result as WhatsAppResponse

    } catch (error) {
      console.error('❌ خطأ في استدعاء Edge Function:', error)
      return {
        success: false,
        message: 'حدث خطأ في الاتصال بالخادم'
      }
    }
  }

  async testConnection(data: TestConnectionData): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('test', data)
  }

  async sendTextMessage(data: any): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('text', data)
  }

  async sendMediaMessage(data: any): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('media', data)
  }

  async sendStickerMessage(data: any): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('sticker', data)
  }

  async sendPollMessage(data: any): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('poll', data)
  }

  async sendButtonMessage(data: any): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('button', data)
  }

  async sendListMessage(data: any): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('list', data)
  }
}

export const whatsappServiceDirect = new WhatsAppServiceDirect()