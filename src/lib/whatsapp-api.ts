// مكتبة إرسال رسائل واتساب
export interface WhatsAppApiResponse {
  status: boolean;
  message?: string;
}

export interface TextMessageData {
  api_key: string;
  sender: string;
  number: string;
  message: string;
  footer?: string;
}

export interface MediaMessageData {
  api_key: string;
  sender: string;
  number: string;
  media_type: string;
  url: string;
  caption?: string;
  footer?: string;
}

export interface StickerMessageData {
  api_key: string;
  sender: string;
  number: string;
  url: string;
}

export interface PollMessageData {
  api_key: string;
  sender: string;
  number: string;
  name: string;
  option: string[];
  countable: string;
}

export interface ButtonMessageData {
  api_key: string;
  sender: string;
  number: string;
  message: string;
  button: any[];
  footer?: string;
  url?: string;
}

class WhatsAppAPI {
  private baseUrl = '/api/whatsapp';

  private async makeRequest(type: string, data: any): Promise<WhatsAppApiResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, data })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('WhatsApp API Error:', error);
      throw error;
    }
  }

  async sendTextMessage(data: TextMessageData): Promise<WhatsAppApiResponse> {
    return this.makeRequest('text', data);
  }

  async sendMediaMessage(data: MediaMessageData): Promise<WhatsAppApiResponse> {
    return this.makeRequest('media', data);
  }

  async sendStickerMessage(data: StickerMessageData): Promise<WhatsAppApiResponse> {
    return this.makeRequest('sticker', data);
  }

  async sendPollMessage(data: PollMessageData): Promise<WhatsAppApiResponse> {
    return this.makeRequest('poll', data);
  }

  async sendButtonMessage(data: ButtonMessageData): Promise<WhatsAppApiResponse> {
    return this.makeRequest('button', data);
  }
}

export const whatsappAPI = new WhatsAppAPI();