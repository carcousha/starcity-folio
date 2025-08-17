const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist')); // Serve built files

// WhatsApp API endpoint
app.post('/api/whatsapp', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    let apiUrl = '';
    let requestBody = {};

    // تحديد نوع الطلب و URL المناسب
    switch (type) {
      case 'text':
        apiUrl = 'https://app.x-growth.tech/send-message';
        requestBody = {
          api_key: data.api_key,
          sender: data.sender,
          number: data.number,
          message: data.message,
          footer: data.footer || ''
        };
        break;
        
      case 'media':
        apiUrl = 'https://app.x-growth.tech/send-media';
        requestBody = {
          api_key: data.api_key,
          sender: data.sender,
          number: data.number,
          media_type: data.media_type,
          url: data.url,
          caption: data.caption || '',
          footer: data.footer || ''
        };
        break;
        
      case 'sticker':
        apiUrl = 'https://app.x-growth.tech/send-sticker';
        requestBody = {
          api_key: data.api_key,
          sender: data.sender,
          number: data.number,
          url: data.url
        };
        break;
        
      case 'poll':
        apiUrl = 'https://app.x-growth.tech/send-poll';
        requestBody = {
          api_key: data.api_key,
          sender: data.sender,
          number: data.number,
          name: data.name,
          option: data.option,
          countable: data.countable
        };
        break;
        
      case 'button':
        apiUrl = 'https://app.x-growth.tech/send-button';
        requestBody = {
          api_key: data.api_key,
          sender: data.sender,
          number: data.number,
          message: data.message,
          button: data.button,
          footer: data.footer || '',
          url: data.url || ''
        };
        break;
        
      default:
        return res.status(400).json({ 
          status: false, 
          message: 'نوع الرسالة غير مدعوم' 
        });
    }

    console.log('إرسال طلب إلى:', apiUrl);
    console.log('بيانات الطلب:', requestBody);

    // إرسال الطلب إلى API الخارجي
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    
    console.log('استجابة API:', result);

    res.json({
      status: response.ok,
      data: result,
      message: response.ok ? 'تم الإرسال بنجاح' : 'فشل في الإرسال'
    });

  } catch (error) {
    console.error('خطأ في Proxy API:', error);
    
    res.status(500).json({ 
      status: false, 
      message: error.message || 'حدث خطأ في الخادم' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'WhatsApp API Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 WhatsApp API Server running on http://localhost:${PORT}`);
  console.log(`📱 API endpoint: http://localhost:${PORT}/api/whatsapp`);
});
