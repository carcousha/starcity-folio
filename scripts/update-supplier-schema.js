// سكريبت لتحديث هيكل جدول الموردين الخارجيين
// Script to update external_suppliers table schema

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // مفتاح الخدمة للعمليات الإدارية

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ متغيرات البيئة مفقودة: VITE_SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSupplierSchema() {
  console.log('🔄 بدء تحديث هيكل جدول الموردين...');

  try {
    // 1. إضافة الحقول الجديدة
    console.log('📝 إضافة الحقول الجديدة...');
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.external_suppliers 
        ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS contact_name TEXT DEFAULT '';
      `
    });

    if (alterError) {
      console.error('❌ خطأ في إضافة الحقول:', alterError);
      return false;
    }

    // 2. تحديث البيانات الموجودة
    console.log('🔄 تحديث البيانات الموجودة...');
    
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE public.external_suppliers 
        SET 
          first_name = COALESCE(SPLIT_PART(name, ' ', 1), ''),
          last_name = COALESCE(SPLIT_PART(name, ' ', 2), ''),
          contact_name = COALESCE(name, '')
        WHERE first_name IS NULL OR first_name = '' OR contact_name IS NULL OR contact_name = '';
      `
    });

    if (updateError) {
      console.error('❌ خطأ في تحديث البيانات:', updateError);
      return false;
    }

    // 3. التحقق من النتائج
    console.log('✅ التحقق من التحديث...');
    
    const { data: testData, error: testError } = await supabase
      .from('external_suppliers')
      .select('id, name, first_name, last_name, contact_name')
      .limit(5);

    if (testError) {
      console.error('❌ خطأ في التحقق:', testError);
      return false;
    }

    console.log('📊 عينة من البيانات المحدثة:');
    console.table(testData);

    console.log('✅ تم تحديث هيكل الجدول بنجاح!');
    return true;

  } catch (error) {
    console.error('❌ خطأ عام:', error);
    return false;
  }
}

// تشغيل السكريبت
updateSupplierSchema()
  .then((success) => {
    if (success) {
      console.log('🎉 تم التحديث بنجاح!');
      process.exit(0);
    } else {
      console.log('❌ فشل في التحديث');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ خطأ في تشغيل السكريبت:', error);
    process.exit(1);
  });
