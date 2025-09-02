// ملف تشخيص مشكلة تحديث جهات الاتصال
// تشغيل هذا الكود في console المتصفح

// فحص حالة المستخدم
async function checkUserAuth() {
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log('🔍 حالة المستخدم:', { user, error });
  
  if (!user) {
    console.error('❌ المستخدم غير مسجل دخول');
    return false;
  }
  
  console.log('✅ المستخدم مسجل دخول:', user.email);
  return true;
}

// فحص السياسات
async function checkPolicies() {
  try {
    // محاولة قراءة البيانات
    const { data: contacts, error: selectError } = await supabase
      .from('enhanced_contacts')
      .select('id, full_name')
      .limit(1);
    
    console.log('📖 نتيجة القراءة:', { contacts, selectError });
    
    if (selectError) {
      console.error('❌ خطأ في القراءة:', selectError);
      return false;
    }
    
    console.log('✅ القراءة تعمل بشكل صحيح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في فحص السياسات:', error);
    return false;
  }
}

// اختبار تحديث جهة اتصال
async function testContactUpdate(contactId) {
  try {
    console.log('🧪 اختبار تحديث جهة الاتصال:', contactId);
    
    const { data, error } = await supabase
      .from('enhanced_contacts')
      .update({
        full_name: 'اختبار التحديث - ' + new Date().toLocaleTimeString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .select();
    
    console.log('📝 نتيجة التحديث:', { data, error });
    
    if (error) {
      console.error('❌ خطأ في التحديث:', error);
      return false;
    }
    
    console.log('✅ التحديث نجح!');
    return true;
  } catch (error) {
    console.error('❌ خطأ في اختبار التحديث:', error);
    return false;
  }
}

// فحص شامل
async function fullDiagnostic() {
  console.log('🔍 بدء التشخيص الشامل...');
  
  // فحص المستخدم
  const userOk = await checkUserAuth();
  if (!userOk) return;
  
  // فحص السياسات
  const policiesOk = await checkPolicies();
  if (!policiesOk) return;
  
  // الحصول على أول جهة اتصال للاختبار
  const { data: contacts } = await supabase
    .from('enhanced_contacts')
    .select('id')
    .limit(1);
  
  if (contacts && contacts.length > 0) {
    await testContactUpdate(contacts[0].id);
  } else {
    console.log('⚠️ لا توجد جهات اتصال للاختبار');
  }
  
  console.log('✅ انتهى التشخيص');
}

// تشغيل التشخيص
fullDiagnostic();

// دالة مساعدة لاختبار تحديث جهة اتصال محددة
window.testUpdate = testContactUpdate;
window.checkAuth = checkUserAuth;
window.checkPolicies = checkPolicies;

console.log('📋 الدوال المتاحة:');
console.log('- testUpdate(contactId): اختبار تحديث جهة اتصال محددة');
console.log('- checkAuth(): فحص حالة تسجيل الدخول');
console.log('- checkPolicies(): فحص السياسات');