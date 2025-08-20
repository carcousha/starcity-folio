import React from 'react';

export default function TestPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#22c55e', marginBottom: '1rem' }}>
          ✅ التطبيق يعمل بشكل صحيح!
        </h1>
        
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          هذه صفحة اختبار بسيطة للتأكد من أن React Router يعمل بشكل صحيح.
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: '#dbeafe',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #93c5fd'
          }}>
            <h3 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>صفحات WhatsApp</h3>
            <p style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: '1rem' }}>
              اختبار صفحات WhatsApp المختلفة
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a 
                href="/whatsapp/test" 
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'white',
                  border: '1px solid #93c5fd',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  color: '#1e40af',
                  fontSize: '0.875rem'
                }}
              >
                صفحة اختبار WhatsApp
              </a>
              <a 
                href="/whatsapp/test-send" 
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'white',
                  border: '1px solid #93c5fd',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  color: '#1e40af',
                  fontSize: '0.875rem'
                }}
              >
                اختبار الإرسال
              </a>
            </div>
          </div>

          <div style={{
            backgroundColor: '#dcfce7',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #86efac'
          }}>
            <h3 style={{ color: '#166534', marginBottom: '0.5rem' }}>صفحات أخرى</h3>
            <p style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '1rem' }}>
              اختبار صفحات أخرى في التطبيق
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a 
                href="/crm" 
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'white',
                  border: '1px solid #86efac',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  color: '#166534',
                  fontSize: '0.875rem'
                }}
              >
                صفحة CRM
              </a>
              <a 
                href="/accounting" 
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'white',
                  border: '1px solid #86efac',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  color: '#166534',
                  fontSize: '0.875rem'
                }}
              >
                صفحة المحاسبة
              </a>
            </div>
          </div>
        </div>

        <div style={{ 
          borderTop: '1px solid #e5e7eb', 
          paddingTop: '1rem',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            إذا كانت هذه الصفحة تظهر بشكل صحيح، فهذا يعني أن التطبيق يعمل بشكل جيد.
          </p>
        </div>
      </div>
    </div>
  );
}
