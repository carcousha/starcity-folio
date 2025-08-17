import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Reports() {
  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">التقارير</h1>
        <p className="text-muted-foreground">تقارير مفصلة عن نشاط WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>تقرير يومي</CardTitle>
            <CardDescription>إحصائيات اليوم</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">سيتم عرض التقرير هنا</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تقرير أسبوعي</CardTitle>
            <CardDescription>إحصائيات الأسبوع</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">سيتم عرض التقرير هنا</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تقرير شهري</CardTitle>
            <CardDescription>إحصائيات الشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">سيتم عرض التقرير هنا</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تقرير سنوي</CardTitle>
            <CardDescription>إحصائيات السنة</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">سيتم عرض التقرير هنا</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>تقرير الأداء</CardTitle>
            <CardDescription>معدل النجاح والفشل</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">سيتم عرض التقرير هنا</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تقرير العملاء</CardTitle>
            <CardDescription>تفاعل العملاء مع الرسائل</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">سيتم عرض التقرير هنا</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تقرير الحملات</CardTitle>
          <CardDescription>أداء الحملات التسويقية</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">سيتم عرض التقرير هنا</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تصدير التقارير</CardTitle>
          <CardDescription>تحميل التقارير بصيغ مختلفة</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">سيتم إضافة خيارات التصدير هنا</p>
        </CardContent>
      </Card>
    </div>
  );
}
