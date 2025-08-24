import React from 'react';

export default function TestPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">صفحة اختبار</h1>
      <p>إذا كنت ترى هذه الرسالة، فالموقع يعمل بشكل طبيعي!</p>
      <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
        <p>✅ React يعمل</p>
        <p>✅ TypeScript يعمل</p>
        <p>✅ Tailwind CSS يعمل</p>
        <p>✅ المسارات تعمل</p>
      </div>
    </div>
  );
}
