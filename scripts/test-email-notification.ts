// @ts-check
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

class NotificationService {
  static async logNotification(options: { userId: string; alertId: string; type: 'email' | 'push' }, status: string, error?: string) {
    await prisma.notificationHistory.create({
      data: {
        alertId: options.alertId,
        type: options.type,
        status,
        error,
      },
    });
  }

  static async getEmailTemplate(alert: any) {
    const severity = alert.severity === 'critical' ? '🚨' : '⚠️';
    
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${severity} Weather Alert for Your Lawn Treatment</h2>
        <p>${alert.message}</p>
        ${alert.suggestedDate ? `
        <p>Suggested Reschedule Date: ${alert.suggestedDate.toLocaleDateString()}</p>
        ` : ''}
        <div style="margin-top: 20px;">
          <a href="http://localhost:3000/dashboard" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Details
          </a>
        </div>
      </div>
    `;
  }

  static async sendEmailNotification(userId: string, alert: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, emailNotifications: true },
      });

      if (!user?.email || !user.emailNotifications) {
        return;
      }

      const emailContent = await this.getEmailTemplate(alert);
      
      await resend.emails.send({
        from: 'Lawn Genius <notifications@lawngenius.app>',
        to: user.email,
        subject: `Weather Alert: ${alert.severity === 'critical' ? 'Critical' : 'Warning'} - Action Required`,
        html: emailContent,
      });

      await this.logNotification(
        { userId, alertId: alert.id, type: 'email' },
        'sent'
      );

      await prisma.weatherAlert.update({
        where: { id: alert.id },
        data: { emailSent: true, emailSentAt: new Date() },
      });
    } catch (error) {
      await this.logNotification(
        { userId, alertId: alert.id, type: 'email' },
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }
}

async function testEmailNotification() {
  try {
    // 1. Create a test user if not exists
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        emailNotifications: true,
        notifyFrequency: 'immediate',
        monitoredConditions: ['temperature', 'wind', 'precipitation', 'conditions']
      }
    });

    // 2. Create a test lawn profile
    const lawnProfile = await prisma.lawnProfile.create({
      data: {
        userId: user.id,
        name: 'Test Lawn',
        size: 1000,
        grassType: 'Bermuda',
        soilType: 'Loam',
        sunExposure: 'Full Sun',
        irrigation: true,
        latitude: 30.2672,
        longitude: -97.7431,
        timezone: 'America/Chicago'
      }
    });

    // 3. Create a test schedule
    const schedule = await prisma.schedule.create({
      data: {
        userId: user.id,
        lawnProfileId: lawnProfile.id,
        name: 'Test Schedule',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    });

    // 4. Create a test treatment
    const treatment = await prisma.treatment.create({
      data: {
        scheduleId: schedule.id,
        type: 'Fertilization',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        weatherScore: 2 // Low score to trigger alert
      }
    });

    // 5. Create a test weather alert
    const alert = await prisma.weatherAlert.create({
      data: {
        treatmentId: treatment.id,
        type: 'temperature',
        severity: 'warning',
        message: 'Test Alert: High temperature expected tomorrow',
        suggestedDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
      }
    });

    // 6. Send test notification
    await NotificationService.sendEmailNotification(user.id, alert);

    console.log('Test email notification sent successfully!');
    console.log('Alert ID:', alert.id);
    console.log('User ID:', user.id);

  } catch (error) {
    console.error('Error sending test notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailNotification();