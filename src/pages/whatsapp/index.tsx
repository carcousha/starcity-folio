// WhatsApp Module Router
// موجه المسارات لوحدة الواتساب

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import WhatsApp pages
import WhatsAppDashboard from './Dashboard';
import WhatsAppContacts from './Contacts';
import WhatsAppCampaigns from './Campaigns';
import WhatsAppQuickSend from './QuickSend';
import WhatsAppBulkSend from './BulkSend';
import WhatsAppTemplates from './Templates';
import WhatsAppReports from './Reports';
import WhatsAppSettings from './Settings';
import TestSend from './TestSend';
import SimpleTest from './SimpleTest';
import TestMedia from './TestMedia';
import TestBucket from './TestBucket';
import TestMediaSimple from './TestMediaSimple';
import TestMediaFinal from './TestMediaFinal';
// import TestPage from './TestPage'; // Commented out to avoid conflict
import AdvancedCampaign from './AdvancedCampaign';
import MediaMessageTest from './MediaMessageTest';
import MessageTypeSelector from './MessageTypeSelector';
import TextMessage from './TextMessage';
import MediaMessage from './MediaMessage';
import AdvancedTextMessage from './AdvancedTextMessage';
import TestAdvanced from './TestAdvanced';

export default function WhatsAppModule() {
  console.log('WhatsAppModule: Router component loaded');
  
  return (
    <Routes>
      {/* Default route - redirect to dashboard */}
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      
      {/* Dashboard */}
      <Route path="dashboard" element={<WhatsAppDashboard />} />
      
      {/* Quick Send */}
      <Route path="quick-send" element={<WhatsAppQuickSend />} />
      
      {/* Bulk Send */}
      <Route path="bulk-send" element={<WhatsAppBulkSend />} />
      
      {/* Advanced Campaign */}
      <Route path="advanced-campaign" element={<AdvancedCampaign />} />
      
      {/* Media Message Test */}
      <Route path="media-test" element={<MediaMessageTest />} />
      
      {/* Message Type Selector */}
      <Route path="message-types" element={<MessageTypeSelector />} />
      
      {/* Text Message Campaign */}
      <Route path="text-message" element={<TextMessage />} />
      
      {/* Media Message Campaign */}
      <Route path="media-message" element={<MediaMessage />} />
      
      {/* Advanced Text Message Campaign */}
      <Route path="advanced-text-message" element={<AdvancedTextMessage />} />
      
      {/* Test Advanced Features */}
      <Route path="test-advanced" element={<TestAdvanced />} />
      
      {/* Simple Test Page */}
      <Route path="simple-test" element={<SimpleTest />} />
      
      {/* Contacts */}
      <Route path="contacts" element={<WhatsAppContacts />} />
      
      {/* Campaigns */}
      <Route path="campaigns" element={<WhatsAppCampaigns />} />
      
      {/* Templates */}
      <Route path="templates" element={<WhatsAppTemplates />} />
      
      {/* Reports */}
      <Route path="reports" element={<WhatsAppReports />} />
      
      {/* Settings */}
      <Route path="settings" element={<WhatsAppSettings />} />
      
      {/* Test Send */}
      <Route path="test-send" element={<TestSend />} />
      
      {/* Simple Test */}
      <Route path="simple-test" element={<SimpleTest />} />
      
      {/* Test Media */}
      <Route path="test-media" element={<TestMedia />} />
      
      {/* Test Bucket */}
      <Route path="test-bucket" element={<TestBucket />} />
      
      {/* Test Media Simple */}
      <Route path="test-media-simple" element={<TestMediaSimple />} />
      
      {/* Test Media Final */}
      <Route path="test-media-final" element={<TestMediaFinal />} />
      
      {/* Test Page */}
      <Route path="test" element={<TestPage />} />
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}


