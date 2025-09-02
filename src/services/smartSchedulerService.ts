// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { whatsappSmartService, SmartTask, SmartSupplier } from './whatsappSmartService';
import { format, addHours, isAfter, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';

export interface ScheduledJob {
  id: string;
  task_id: string;
  scheduled_time: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  retry_count: number;
  max_retries: number;
  created_at: string;
  executed_at: string | null;
  error_message: string | null;
}

export interface AutoSendResult {
  success: boolean;
  messagesSent: number;
  errors: string[];
  suppliersProcessed: number;
}

class SmartSchedulerService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // فحص كل دقيقة

  // بدء خدمة الجدولة التلقائية
  startScheduler(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting Smart Scheduler Service...');

    // فحص فوري
    this.checkAndExecuteTasks();

    // فحص دوري
    this.intervalId = setInterval(() => {
      this.checkAndExecuteTasks();
    }, this.CHECK_INTERVAL);
  }

  // إيقاف خدمة الجدولة
  stopScheduler(): void {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Smart Scheduler Service stopped');
  }

  // فحص وتنفيذ المهام المستحقة
  private async checkAndExecuteTasks(): Promise<void> {
    try {
      const now = new Date();
      console.log(`Checking for scheduled tasks at ${format(now, 'yyyy-MM-dd HH:mm:ss')}`);

      // جلب المهام المستحقة للتنفيذ
      const dueTasks = await this.getDueTasks();
      
      if (dueTasks.length === 0) {
        console.log('No due tasks found');
        return;
      }

      console.log(`Found ${dueTasks.length} due tasks`);

      // تنفيذ كل مهمة
      for (const task of dueTasks) {
        await this.executeTask(task);
      }
    } catch (error) {
      console.error('Error in checkAndExecuteTasks:', error);
    }
  }

  // جلب المهام المستحقة للتنفيذ
  private async getDueTasks(): Promise<SmartTask[]> {
    try {
      const now = new Date();
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_date', format(now, 'yyyy-MM-dd'))
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      // فلترة المهام حسب وقت التذكير
      const filteredTasks = (data || []).filter(task => {
        if (!task.reminder_time) return true;
        
        const [hours, minutes] = task.reminder_time.split(':').map(Number);
        const reminderTime = new Date();
        reminderTime.setHours(hours, minutes, 0, 0);
        
        return now >= reminderTime;
      });

      return filteredTasks;
    } catch (error) {
      console.error('Error getting due tasks:', error);
      return [];
    }
  }

  // تنفيذ مهمة واحدة
  private async executeTask(task: SmartTask): Promise<void> {
    try {
      console.log(`Executing task: ${task.title} (ID: ${task.id})`);

      // تحديث حالة المهمة إلى "قيد التنفيذ"
      await whatsappSmartService.updateTaskStatus(task.id, 'in_progress');

      let result: AutoSendResult;

      switch (task.task_type) {
        case 'whatsapp_message':
          result = await this.executeWhatsAppTask(task);
          break;
        case 'follow_up':
          result = await this.executeFollowUpTask(task);
          break;
        case 'meeting':
          result = await this.executeMeetingTask(task);
          break;
        default:
          result = await this.executeGenericTask(task);
      }

      // تحديث حالة المهمة حسب النتيجة
      if (result.success) {
        await whatsappSmartService.updateTaskStatus(task.id, 'completed');
        console.log(`Task ${task.id} completed successfully. Messages sent: ${result.messagesSent}`);
      } else {
        await whatsappSmartService.updateTaskStatus(task.id, 'cancelled');
        console.error(`Task ${task.id} failed:`, result.errors);
      }

      // تسجيل النتيجة
      await this.logTaskExecution(task, result);

    } catch (error) {
      console.error(`Error executing task ${task.id}:`, error);
      await whatsappSmartService.updateTaskStatus(task.id, 'cancelled');
    }
  }

  // تنفيذ مهمة إرسال رسائل واتساب
  private async executeWhatsAppTask(task: SmartTask): Promise<AutoSendResult> {
    try {
      const settings = await whatsappSmartService.loadSettings();
      if (!settings || !settings.auto_send_enabled) {
        return {
          success: false,
          messagesSent: 0,
          errors: ['Auto send is disabled in settings'],
          suppliersProcessed: 0
        };
      }

      // جلب الموردين المؤهلين للإرسال
      const eligibleSuppliers = await this.getEligibleSuppliersForTask(task);
      
      if (eligibleSuppliers.length === 0) {
        return {
          success: true,
          messagesSent: 0,
          errors: [],
          suppliersProcessed: 0
        };
      }

      // تحديد عدد الرسائل المطلوب إرسالها
      const targetCount = Math.min(
        task.target_count || settings.daily_message_limit,
        eligibleSuppliers.length,
        settings.daily_message_limit
      );

      const suppliersToContact = eligibleSuppliers.slice(0, targetCount);
      let messagesSent = 0;
      const errors: string[] = [];

      // إرسال الرسائل
      for (const supplier of suppliersToContact) {
        try {
          const message = this.formatMessage(settings.message_template_ar, supplier.contact_name || supplier.name);
          const success = await this.sendWhatsAppMessage(supplier.phone, message);

          if (success) {
            // تسجيل الرسالة
            await whatsappSmartService.logMessage({
              supplier_id: supplier.id,
              task_id: task.id,
              message_template: settings.message_template_ar,
              message_sent: message,
              phone_number: supplier.phone,
              status: 'sent',
              whatsapp_message_id: null,
              sent_at: new Date().toISOString(),
              sent_by: 'system'
            });

            // تحديث آخر تواصل
            await whatsappSmartService.updateSupplier(supplier.id, {
              last_contact_date: new Date().toISOString(),
              last_contact_type: 'whatsapp'
            });

            messagesSent++;
          } else {
            errors.push(`Failed to send message to ${supplier.name} (${supplier.phone})`);
          }
        } catch (error) {
          errors.push(`Error sending to ${supplier.name}: ${error}`);
        }
      }

      return {
        success: errors.length < suppliersToContact.length / 2, // نجح إذا فشل أقل من 50%
        messagesSent,
        errors,
        suppliersProcessed: suppliersToContact.length
      };

    } catch (error) {
      return {
        success: false,
        messagesSent: 0,
        errors: [`Task execution error: ${error}`],
        suppliersProcessed: 0
      };
    }
  }

  // جلب الموردين المؤهلين لمهمة معينة
  private async getEligibleSuppliersForTask(task: SmartTask): Promise<SmartSupplier[]> {
    try {
      const settings = await whatsappSmartService.loadSettings();
      if (!settings) return [];

      // جلب جميع الموردين النشطين
      const allSuppliers = await whatsappSmartService.loadSuppliers();
      
      // فلترة حسب الفئات المحددة في الإعدادات
      const categoryFilteredSuppliers = allSuppliers.filter(supplier => 
        settings.target_categories.includes(supplier.category)
      );

      // فلترة حسب فترة منع التكرار
      const eligibleSuppliers: SmartSupplier[] = [];
      
      for (const supplier of categoryFilteredSuppliers) {
        const canSend = await whatsappSmartService.canSendMessage(supplier.id);
        if (canSend) {
          eligibleSuppliers.push(supplier);
        }
      }

      // ترتيب حسب الأولوية
      eligibleSuppliers.sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      return eligibleSuppliers;
    } catch (error) {
      console.error('Error getting eligible suppliers:', error);
      return [];
    }
  }

  // تنفيذ مهمة المتابعة
  private async executeFollowUpTask(task: SmartTask): Promise<AutoSendResult> {
    // يمكن تخصيص هذه الدالة لمهام المتابعة
    console.log(`Executing follow-up task: ${task.title}`);
    return {
      success: true,
      messagesSent: 0,
      errors: [],
      suppliersProcessed: 0
    };
  }

  // تنفيذ مهمة الاجتماع
  private async executeMeetingTask(task: SmartTask): Promise<AutoSendResult> {
    // يمكن تخصيص هذه الدالة لمهام الاجتماعات
    console.log(`Executing meeting task: ${task.title}`);
    return {
      success: true,
      messagesSent: 0,
      errors: [],
      suppliersProcessed: 0
    };
  }

  // تنفيذ مهمة عامة
  private async executeGenericTask(task: SmartTask): Promise<AutoSendResult> {
    console.log(`Executing generic task: ${task.title}`);
    return {
      success: true,
      messagesSent: 0,
      errors: [],
      suppliersProcessed: 0
    };
  }

  // إرسال رسالة واتساب
  private async sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
    try {
      // هنا يمكن إضافة منطق إرسال الرسالة عبر WhatsApp Business API
      // حالياً نستخدم محاكاة للإرسال
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
      
      console.log('Sending WhatsApp message:', { phone, message, url: whatsappUrl });
      
      // محاكاة تأخير الإرسال
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // محاكاة نجاح الإرسال (90% نجاح)
      return Math.random() > 0.1;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  // تنسيق الرسالة
  private formatMessage(template: string, supplierName: string): string {
    return template.replace('{supplier_name}', supplierName);
  }

  // تسجيل تنفيذ المهمة
  private async logTaskExecution(task: SmartTask, result: AutoSendResult): Promise<void> {
    try {
      const logData = {
        task_id: task.id,
        task_title: task.title,
        execution_time: new Date().toISOString(),
        success: result.success,
        messages_sent: result.messagesSent,
        suppliers_processed: result.suppliersProcessed,
        errors: result.errors.join('; '),
        metadata: JSON.stringify({
          task_type: task.task_type,
          target_count: task.target_count,
          scheduled_date: task.scheduled_date
        })
      };

      const { error } = await supabase
        .from('task_execution_logs')
        .insert([logData]);

      if (error) {
        console.error('Error logging task execution:', error);
      }
    } catch (error) {
      console.error('Error in logTaskExecution:', error);
    }
  }

  // جلب إحصائيات التنفيذ
  async getExecutionStats(days: number = 7): Promise<{
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalMessagesSent: number;
    averageSuccessRate: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('task_execution_logs')
        .select('*')
        .gte('execution_time', startDate.toISOString());

      if (error) throw error;

      const logs = data || [];
      const totalTasks = logs.length;
      const completedTasks = logs.filter(log => log.success).length;
      const failedTasks = totalTasks - completedTasks;
      const totalMessagesSent = logs.reduce((sum, log) => sum + (log.messages_sent || 0), 0);
      const averageSuccessRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        totalTasks,
        completedTasks,
        failedTasks,
        totalMessagesSent,
        averageSuccessRate
      };
    } catch (error) {
      console.error('Error getting execution stats:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        totalMessagesSent: 0,
        averageSuccessRate: 0
      };
    }
  }

  // تشغيل مهمة فورية
  async runTaskNow(taskId: string): Promise<AutoSendResult> {
    try {
      const { data: task, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error || !task) {
        return {
          success: false,
          messagesSent: 0,
          errors: ['Task not found'],
          suppliersProcessed: 0
        };
      }

      await this.executeTask(task);
      return {
        success: true,
        messagesSent: 0,
        errors: [],
        suppliersProcessed: 0
      };
    } catch (error) {
      return {
        success: false,
        messagesSent: 0,
        errors: [`Error running task: ${error}`],
        suppliersProcessed: 0
      };
    }
  }

  // فحص حالة الجدولة
  getSchedulerStatus(): {
    isRunning: boolean;
    checkInterval: number;
    uptime: string;
  } {
    return {
      isRunning: this.isRunning,
      checkInterval: this.CHECK_INTERVAL,
      uptime: this.isRunning ? 'Active' : 'Stopped'
    };
  }
}

export const smartSchedulerService = new SmartSchedulerService();
export default smartSchedulerService;
