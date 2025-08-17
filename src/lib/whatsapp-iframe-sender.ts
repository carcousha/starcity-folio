/**
 * WhatsApp Sender Library using iframe to avoid CORS issues
 */

export interface WhatsAppMessage {
  type: 'text' | 'media' | 'sticker' | 'poll' | 'button' | 'list';
  data: {
    api_key: string;
    sender: string;
    number: string;
    message?: string;
    media_type?: string;
    url?: string;
    caption?: string;
    footer?: string;
    button?: any[];
    list?: any[];
    poll_name?: string;
    poll_options?: string[];
    poll_countable?: boolean;
  };
}

export interface WhatsAppResponse {
  status: boolean;
  message: string;
  data?: any;
  error?: string;
}

class WhatsAppSender {
  private iframe: HTMLIFrameElement | null = null;
  private pendingRequests = new Map<string, { resolve: Function; reject: Function }>();

  constructor() {
    this.setupMessageListener();
  }

  private setupMessageListener() {
    window.addEventListener('message', (event) => {
      // قبول الرسائل من iframe محلي
      if (event.origin !== window.location.origin) return;
      
      const { requestId, response, error } = event.data;
      const pendingRequest = this.pendingRequests.get(requestId);
      
      if (pendingRequest) {
        this.pendingRequests.delete(requestId);
        
        if (error) {
          pendingRequest.reject(new Error(error));
        } else {
          pendingRequest.resolve(response);
        }
      }
    });
  }

  private createIframe(): HTMLIFrameElement {
    if (this.iframe) {
      return this.iframe;
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = '/whatsapp-iframe-bridge.html';
    document.body.appendChild(iframe);
    
    this.iframe = iframe;
    return iframe;
  }

  private generateRequestId(): string {
    return `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async sendMessage(messageData: WhatsAppMessage): Promise<WhatsAppResponse> {
    return new Promise((resolve, reject) => {
      const iframe = this.createIframe();
      const requestId = this.generateRequestId();
      
      this.pendingRequests.set(requestId, { resolve, reject });
      
      // Wait for iframe to load
      iframe.onload = () => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            requestId,
            action: 'sendMessage',
            data: messageData
          }, window.location.origin);
        }
      };
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async testConnection(apiKey: string, sender: string): Promise<WhatsAppResponse> {
    return this.sendMessage({
      type: 'text',
      data: {
        api_key: apiKey,
        sender,
        number: '+971501234567',
        message: 'اختبار الاتصال من StarCity Folio'
      }
    });
  }

  // Cleanup method
  destroy() {
    if (this.iframe) {
      document.body.removeChild(this.iframe);
      this.iframe = null;
    }
    this.pendingRequests.clear();
  }
}

// Create singleton instance
const whatsappSender = new WhatsAppSender();

export default whatsappSender;

// Export specific methods for easier use
export const sendWhatsAppMessage = (messageData: WhatsAppMessage) => 
  whatsappSender.sendMessage(messageData);

export const testWhatsAppConnection = (apiKey: string, sender: string) => 
  whatsappSender.testConnection(apiKey, sender);