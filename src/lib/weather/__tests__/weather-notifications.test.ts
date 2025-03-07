import { WeatherNotificationHandler } from '@/lib/notifications/weather-notifications';
import { prisma } from '@/lib/db/prisma';
import { NotificationService } from '@/lib/notifications';
import { WeatherAlert } from '@/lib/weather/types';

// Mock dependencies
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    weatherAlert: {
      create: jest.fn(),
    },
    treatment: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/notifications', () => ({
  NotificationService: {
    sendEmailNotification: jest.fn(),
    sendPushNotification: jest.fn(),
  },
}));

describe('WeatherNotificationHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTreatment = {
    id: 'treatment-1',
    schedule: {
      user: {
        id: 'user-1',
        emailNotifications: true,
        pushNotifications: true,
        notifyFrequency: 'immediate',
        monitoredConditions: ['temperature', 'wind', 'precipitation', 'conditions'],
      },
    },
  };

  const mockWeatherAlert: WeatherAlert = {
    id: 'alert-1',
    treatmentId: 'treatment-1',
    treatmentType: 'Fertilization',
    type: 'temperature',
    severity: 'warning',
    message: 'Temperature too high for fertilization',
    createdAt: new Date(),
    location: {
      latitude: 41.8781,
      longitude: -87.6298,
      timezone: 'America/Chicago',
    },
    originalDate: new Date(),
  };

  describe('handleWeatherAlert', () => {
    it('should save alert and send notifications when conditions are monitored', async () => {
      // Mock successful database operations
      (prisma.weatherAlert.create as jest.Mock).mockResolvedValue({
        ...mockWeatherAlert,
        id: 'saved-alert-1',
      });
      (prisma.treatment.findUnique as jest.Mock).mockResolvedValue(mockTreatment);

      await WeatherNotificationHandler.handleWeatherAlert(mockWeatherAlert);

      // Verify alert was saved
      expect(prisma.weatherAlert.create).toHaveBeenCalledWith({
        data: {
          treatmentId: mockWeatherAlert.treatmentId,
          type: mockWeatherAlert.type,
          severity: mockWeatherAlert.severity,
          message: mockWeatherAlert.message,
          suggestedDate: mockWeatherAlert.suggestedDate,
        },
      });

      // Verify notifications were sent
      expect(NotificationService.sendEmailNotification).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ id: 'saved-alert-1' })
      );
      expect(NotificationService.sendPushNotification).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ id: 'saved-alert-1' })
      );
    });

    it('should not send notifications for unmonitored conditions', async () => {
      const unmonitoredTreatment = {
        ...mockTreatment,
        schedule: {
          user: {
            ...mockTreatment.schedule.user,
            monitoredConditions: ['wind'], // User only monitors wind conditions
          },
        },
      };

      (prisma.weatherAlert.create as jest.Mock).mockResolvedValue({
        ...mockWeatherAlert,
        id: 'saved-alert-2',
      });
      (prisma.treatment.findUnique as jest.Mock).mockResolvedValue(unmonitoredTreatment);

      await WeatherNotificationHandler.handleWeatherAlert(mockWeatherAlert);

      // Alert should still be saved
      expect(prisma.weatherAlert.create).toHaveBeenCalled();

      // But no notifications should be sent
      expect(NotificationService.sendEmailNotification).not.toHaveBeenCalled();
      expect(NotificationService.sendPushNotification).not.toHaveBeenCalled();
    });

    it('should handle missing treatment gracefully', async () => {
      (prisma.weatherAlert.create as jest.Mock).mockResolvedValue({
        ...mockWeatherAlert,
        id: 'saved-alert-3',
      });
      (prisma.treatment.findUnique as jest.Mock).mockResolvedValue(null);

      await WeatherNotificationHandler.handleWeatherAlert(mockWeatherAlert);

      // Alert should still be saved
      expect(prisma.weatherAlert.create).toHaveBeenCalled();

      // But no notifications should be sent
      expect(NotificationService.sendEmailNotification).not.toHaveBeenCalled();
      expect(NotificationService.sendPushNotification).not.toHaveBeenCalled();
    });

    it('should handle database errors without throwing', async () => {
      const error = new Error('Database connection failed');
      (prisma.weatherAlert.create as jest.Mock).mockRejectedValue(error);

      await expect(
        WeatherNotificationHandler.handleWeatherAlert(mockWeatherAlert)
      ).resolves.not.toThrow();

      // No notifications should be sent on error
      expect(NotificationService.sendEmailNotification).not.toHaveBeenCalled();
      expect(NotificationService.sendPushNotification).not.toHaveBeenCalled();
    });
  });
});