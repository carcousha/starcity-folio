import { SecurityAudit } from '@/components/SecurityAudit';
import SecurityEnhancementDialog from '@/components/security/SecurityEnhancementDialog';

export default function SecurityAuditPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">تدقيق الأمان</h1>
            <p className="text-muted-foreground">
              مراقبة وإدارة أمان النظام والبيانات
            </p>
          </div>
          <SecurityEnhancementDialog />
        </div>
        <SecurityAudit />
      </div>
    </div>
  );
}