// WhatsApp Module Router
// موجه المسارات لوحدة الواتساب

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import WhatsApp pages
import WhatsAppDashboard from './Dashboard';
import WhatsAppContacts from './Contacts';
import WhatsAppCampaigns from './Campaigns';
import WhatsAppQuickSend from './QuickSend';
import WhatsAppTemplates from './Templates';
import WhatsAppReports from './Reports';
import WhatsAppSettings from './Settings';

export default function WhatsAppModule() {
  return (
    <Routes>
      {/* Default route - redirect to dashboard */}
      <Route path="/" element={<Navigate to="/whatsapp/dashboard" replace />} />
      
      {/* Dashboard */}
      <Route path="/dashboard" element={<WhatsAppDashboard />} />
      
      {/* Quick Send */}
      <Route path="/quick-send" element={<WhatsAppQuickSend />} />
      
      {/* Contacts */}
      <Route path="/contacts" element={<WhatsAppContacts />} />
      
      {/* Campaigns */}
      <Route path="/campaigns" element={<WhatsAppCampaigns />} />
      
      {/* Templates */}
      <Route path="/templates" element={<WhatsAppTemplates />} />
      
      {/* Reports */}
      <Route path="/reports" element={<WhatsAppReports />} />
      
      {/* Settings */}
      <Route path="/settings" element={<WhatsAppSettings />} />
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/whatsapp/dashboard" replace />} />
    </Routes>
  );
}


