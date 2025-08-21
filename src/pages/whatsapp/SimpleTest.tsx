import React, { useEffect } from 'react';

export default function SimpleTest() {
  useEffect(() => {
    console.log('SimpleTest: Component mounted successfully');
    console.log('SimpleTest: React version:', React.version);
    console.log('SimpleTest: Current URL:', window.location.href);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">النظام يعمل بنجاح!</h1>
          <p className="text-gray-600 mb-6">صفحة اختبار بسيطة للتأكد من عمل React Router</p>
          
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-green-800 font-medium">✅ React يعمل</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 font-medium">✅ Router يعمل</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-purple-800 font-medium">✅ Styling يعمل</p>
            </div>
          </div>
          
          <div className="mt-6">
            <a 
              href="/whatsapp/dashboard" 
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              الذهاب للوحة التحكم
            </a>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>URL: {window.location.href}</p>
            <p>React Version: {React.version}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
