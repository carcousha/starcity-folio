import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, X, Star } from 'lucide-react';
import { ContactFilters, CONTACT_CATEGORIES } from '@/types/enhancedContacts';

interface ContactsFiltersProps {
  filters: ContactFilters;
  onFiltersChange: (filters: ContactFilters) => void;
  onReset: () => void;
}

export default function ContactsFilters({ 
  filters, 
  onFiltersChange, 
  onReset 
}: ContactsFiltersProps) {
  const updateFilter = (key: keyof ContactFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.category || 
    filters.minRating !== undefined || 
    filters.maxRating !== undefined || 
    filters.officeFilter;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4" />
          <h3 className="font-medium">البحث والفلترة</h3>
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReset}
              className="mr-auto"
            >
              <X className="h-3 w-3 mr-1" />
              إزالة الفلاتر
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* البحث */}
          <div className="lg:col-span-2">
            <Label htmlFor="search">البحث</Label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="ابحث بالاسم، الهاتف، أو المكتب..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* التصنيف */}
          <div>
            <Label>التصنيف</Label>
            <Select 
              value={filters.category || 'all'} 
              onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="جميع التصنيفات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                {CONTACT_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* التقييم الأدنى */}
          <div>
            <Label>التقييم الأدنى</Label>
            <Select 
              value={filters.minRating?.toString() || 'all'} 
              onValueChange={(value) => updateFilter('minRating', value === 'all' ? undefined : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="أي تقييم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">أي تقييم</SelectItem>
                {[1, 2, 3, 4, 5].map(rating => (
                  <SelectItem key={rating} value={rating.toString()}>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {rating} فأكثر
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* المكتب */}
          <div>
            <Label htmlFor="office">المكتب</Label>
            <Input
              id="office"
              placeholder="اسم المكتب..."
              value={filters.officeFilter || ''}
              onChange={(e) => updateFilter('officeFilter', e.target.value)}
            />
          </div>
        </div>

        {/* إحصائيات سريعة */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>الفلاتر النشطة:</span>
              {filters.search && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                  البحث: "{filters.search}"
                </span>
              )}
              {filters.category && (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                  {filters.category}
                </span>
              )}
              {filters.minRating && (
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                  {filters.minRating}+ نجوم
                </span>
              )}
              {filters.officeFilter && (
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                  مكتب: "{filters.officeFilter}"
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}