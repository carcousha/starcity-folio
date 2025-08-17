import { supabase } from '@/integrations/supabase/client'

export interface WhatsAppResponse {
  success: boolean
  message: string
  data?: any
}

export interface TextMessageData {
  sender: string
  number: string
  message: string
  footer?: string
}

export interface MediaMessageData {
  sender: string
  number: string
  media_type: string
  url: string
  caption?: string
  footer?: string
}

export interface StickerMessageData {
  sender: string
  number: string
  url: string
}

export interface PollMessageData {
  sender: string
  number: string
  name: string
  option: string[]
  countable: string
}

export interface ButtonMessageData {
  sender: string
  number: string
  message: string
  button: any[]
  footer?: string
  url?: string
}

export interface ListMessageData {
  sender: string
  number: string
  message: string
  list: any[]
  footer?: string
}

export interface TestConnectionData {
  sender: string
  number?: string
  message?: string
}

class WhatsAppService {
  private async callEdgeFunction(type: string, data: any): Promise<WhatsAppResponse> {
    try {
      console.log(`📤 استدعاء Edge Function للنوع: ${type}`)
      
      const { data: result, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: { type, ...data }
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

  async sendTextMessage(data: TextMessageData): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('text', data)
  }

  async sendMediaMessage(data: MediaMessageData): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('media', data)
  }

  async sendStickerMessage(data: StickerMessageData): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('sticker', data)
  }

  async sendPollMessage(data: PollMessageData): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('poll', data)
  }

  async sendButtonMessage(data: ButtonMessageData): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('button', data)
  }

  async sendListMessage(data: ListMessageData): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('list', data)
  }

  async testConnection(data: TestConnectionData): Promise<WhatsAppResponse> {
    return this.callEdgeFunction('test', data)
  }
}

export const whatsappService = new WhatsAppService()