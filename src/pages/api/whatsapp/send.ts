import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method not allowed' });
  }

  try {
    const { number, message, footer } = req.body;

    if (!number || !message) {
      return res.status(400).json({ 
        status: false, 
        message: 'رقم الهاتف والرسالة مطلوبان' 
      });
    }

    // إرسال الرسالة عبر WhatsApp API
    const response = await fetch('https://hrjyjemacsjoouobcgri.supabase.co/functions/v1/whatsapp-api-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyanlqZW1hY3Nqb291b2JjZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjgxOTIsImV4cCI6MjA2OTQ0NDE5Mn0.MVVJNBVlK-meXguUyO76HqjawbPgAAzhIvKG9oWKBlk`,
      },
      body: JSON.stringify({
        api_key: process.env.WHATSAPP_API_KEY || 'your_api_key_here',
        sender: process.env.WHATSAPP_SENDER || '971501234567',
        number: number,
        message: message,
        footer: footer || 'Sent via StarCity Folio'
      })
    });

    const result = await response.json();

    if (result.status) {
      return res.status(200).json({
        status: true,
        message: 'تم إرسال الرسالة بنجاح',
        data: result
      });
    } else {
      return res.status(400).json({
        status: false,
        message: result.message || 'فشل في إرسال الرسالة',
        error: result.error
      });
    }

  } catch (error) {
    console.error('WhatsApp API Error:', error);
    return res.status(500).json({
      status: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
}
