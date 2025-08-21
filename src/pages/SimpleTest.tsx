import React from 'react';

export default function SimpleTest() {
  console.log('SimpleTest: Component is loading...');
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fef3c7',
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#f59e0b',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          fontSize: '2rem',
          color: 'white'
        }}>
          🧪
        </div>
        
        <h1 style={{
          color: '#1f2937',
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          صفحة WhatsApp بسيطة
        </h1>
        
        <p style={{
          color: '#6b7280',
          fontSize: '1.1rem',
          marginBottom: '2rem'
        }}>
          هذه صفحة اختبار بسيطة بدون أي تبعيات معقدة
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #fbbf24'
          }}>
            <h3 style={{ color: '#92400e', marginBottom: '0.5rem' }}>React</h3>
            <p style={{ fontSize: '0.9rem', color: '#92400e' }}>✅ يعمل</p>
          </div>
          
          <div style={{
            backgroundColor: '#dbeafe',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #93c5fd'
          }}>
            <h3 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>Router</h3>
            <p style={{ fontSize: '0.9rem', color: '#1e40af' }}>✅ يعمل</p>
          </div>
        </div>
        
        <div style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '1rem',
          marginBottom: '2rem'
        }}>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
            URL: {window.location.href}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            React Version: {React.version}
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <a 
            href="/test-app" 
            style={{
              padding: '1rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#374151',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
          >
            🧪 العودة لصفحة React
          </a>
          
          <a 
            href="/" 
            style={{
              padding: '1rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#374151',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
          >
            🔐 صفحة تسجيل الدخول
          </a>
        </div>
      </div>
    </div>
  );
}
