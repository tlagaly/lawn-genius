import { WeatherAlert, WeatherAlertType } from '@/lib/weather/types';
import { NotificationService } from './index';
import { prisma } from '@/lib/db/prisma';

type PushNotificationData = {
  title: string;
  body: string;
  data: {
    type: string;
    alertId: string;
    treatmentId: string;
  };
};

export class WeatherNotificationHandler {
  private static isValidCondition(condition: unknown): condition is WeatherAlertType {
    return typeof condition === 'string' &&
      ['temperature', 'wind', 'precipitation', 'conditions'].includes(condition);
  }
  static async handleWeatherAlert(alert: WeatherAlert): Promise<void> {
    try {
      // 1. Save alert to database
      const savedAlert = await prisma.weatherAlert.create({
        data: {
          treatmentId: alert.treatmentId,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          suggestedDate: alert.suggestedDate,
        },
      });

      // 2. Get treatment details to find the user
      const treatment = await prisma.treatment.findUnique({
        where: { id: alert.treatmentId },
        include: {
          schedule: {
            include: {
              user: {
                select: {
                  id: true,
                  emailNotifications: true,
                  pushNotifications: true,
                  notifyFrequency: true,
                  monitoredConditions: true,
                },
              },
            },
          },
        },
      });

      if (!treatment?.schedule?.user) {
        console.error('Could not find user for treatment:', alert.treatmentId);
        return;
      }

      const user = treatment.schedule.user;

      // 3. Check if user wants notifications for this type of alert
      const monitoredConditions = user.monitoredConditions as string[] || [];
      if (!monitoredConditions.some(condition =>
        WeatherNotificationHandler.isValidCondition(condition) &&
        condition === alert.type
      )) {
        console.log(`User ${user.id} does not monitor ${alert.type} alerts`);
        return;
      }

      // 4. Send notifications based on user preferences
      if (user.emailNotifications) {
        await NotificationService.sendEmailNotification(user.id, savedAlert);
      }

      if (user.pushNotifications) {
        const pushData: PushNotificationData = {
          title: `Weather Alert: ${alert.severity === 'critical' ? 'Critical' : 'Warning'}`,
          body: alert.message,
          data: {
            type: 'weather_alert',
            alertId: savedAlert.id,
            treatmentId: alert.treatmentId,
          },
        };
        await NotificationService.sendPushNotification(user.id, pushData);
      }

      console.log('Successfully processed weather alert:', {
        alertId: savedAlert.id,
        userId: user.id,
        type: alert.type,
        severity: alert.severity,
      });
    } catch (error) {
      console.error('Error processing weather alert:', error);
      // Don't throw - we don't want to break the weather monitoring
    }
  }
}