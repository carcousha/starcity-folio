import { SecurityAudit } from '@/components/SecurityAudit';

export default function SecurityAuditPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">تدقيق الأمان</h1>
          <p className="text-muted-foreground">
            مراقبة وإدارة أمان النظام والبيانات
          </p>
        </div>
        <SecurityAudit />
      </div>
    </div>
  );
}