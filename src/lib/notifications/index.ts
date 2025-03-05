import { Resend } from 'resend';
import { prisma } from '../db/prisma';
import { WeatherAlert } from '@prisma/client';

const resend = new Resend(process.env.RESEND_API_KEY);

interface NotificationOptions {
  userId: string;
  alertId: string;
  type: 'email' | 'push';
}

export class NotificationService {
  private static async logNotification(options: NotificationOptions, status: string, error?: string) {
    await prisma.notificationHistory.create({
      data: {
        alertId: options.alertId,
        type: options.type,
        status,
        error,
      },
    });
  }

  private static async getEmailTemplate(alert: WeatherAlert) {
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

  static async sendEmailNotification(userId: string, alert: WeatherAlert) {
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

  static async sendPushNotification(userId: string, alert: WeatherAlert) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushNotifications: true, pushSubscription: true },
      });

      if (!user?.pushNotifications || !user.pushSubscription) {
        return;
      }

      const subscription = JSON.parse(user.pushSubscription);
      const severity = alert.severity === 'critical' ? '🚨' : '⚠️';
      
      const payload = JSON.stringify({
        title: `${severity} Weather Alert`,
        body: alert.message,
        icon: '/weather-alert-icon.png',
        data: {
          url: `http://localhost:3000/dashboard?alert=${alert.id}`,
        },
      });

      // Web Push notification will be implemented here
      // We'll need to add web-push package and VAPID keys
      
      await this.logNotification(
        { userId, alertId: alert.id, type: 'push' },
        'sent'
      );

      await prisma.weatherAlert.update({
        where: { id: alert.id },
        data: { pushSent: true, pushSentAt: new Date() },
      });
    } catch (error) {
      await this.logNotification(
        { userId, alertId: alert.id, type: 'push' },
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  static async sendNotification(userId: string, alert: WeatherAlert) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailNotifications: true,
        pushNotifications: true,
        notifyFrequency: true,
        monitoredConditions: true,
      },
    });

    if (!user) return;

    // Check if the alert type is being monitored
    const monitoredConditions = user.monitoredConditions as string[] | null;
    if (monitoredConditions && !monitoredConditions.includes(alert.type)) {
      return;
    }

    // Handle notification frequency
    if (user.notifyFrequency !== 'immediate') {
      // Store for batch processing based on frequency
      // This will be implemented in a separate batch processing system
      return;
    }

    const promises = [];
    if (user.emailNotifications) {
      promises.push(this.sendEmailNotification(userId, alert));
    }
    if (user.pushNotifications) {
      promises.push(this.sendPushNotification(userId, alert));
    }

    await Promise.allSettled(promises);
  }
}