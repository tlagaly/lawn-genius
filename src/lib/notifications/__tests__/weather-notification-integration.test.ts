import { prisma } from '@/lib/db/prisma';
import { WeatherNotificationHandler } from '@/lib/notifications/weather-notifications';
import { NotificationService } from '@/lib/notifications';
import { WeatherAlert, Location } from '@/lib/weather/types';

// Mock Prisma
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    weatherAlert: {
      create: jest.fn(),
      update: jest.fn(),
    },
    treatment: {
      findUnique: jest.fn(),
    },
    notificationHistory: {
      create: jest.fn(),
    },
  },
}));

// Mock NotificationService
jest.mock('@/lib/notifications', () => ({
  NotificationService: {
    sendEmailNotification: jest.fn(),
    sendPushNotification: jest.fn(),
  },
}));

describe('Weather Notification Integration', () => {
  const mockLocation: Location = {
    latitude: 41.8781,
    longitude: -87.6298,
    timezone: 'America/Chicago',
  };

  const mockAlert: WeatherAlert = {
    id: 'alert-1',
    treatmentId: 'treatment-1',
    treatmentType: 'Fertilization',
    type: 'temperature',
    severity: 'warning',
    message: 'Temperature is too high for treatment',
    createdAt: new Date(),
    location: mockLocation,
    originalDate: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    emailNotifications: true,
    pushNotifications: true,
    notifyFrequency: 'immediate',
    monitoredConditions: ['temperature', 'wind', 'precipitation', 'conditions'],
  };

  const mockTreatment = {
    id: 'treatment-1',
    schedule: {
      user: mockUser,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.treatment.findUnique as jest.Mock).mockResolvedValue(mockTreatment);
    (prisma.weatherAlert.create as jest.Mock).mockImplementation((data) => Promise.resolve({ ...data.data, id: 'saved-alert-1' }));
  });

  it('saves alert to database and sends notifications', async () => {
    await WeatherNotificationHandler.handleWeatherAlert(mockAlert);

    // Verify alert was saved
    expect(prisma.weatherAlert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        treatmentId: mockAlert.treatmentId,
        type: mockAlert.type,
        severity: mockAlert.severity,
        message: mockAlert.message,
      }),
    });

    // Verify notifications were sent
    expect(NotificationService.sendEmailNotification).toHaveBeenCalled();
    expect(NotificationService.sendPushNotification).toHaveBeenCalled();
  });

  it('respects user notification preferences', async () => {
    const userWithoutNotifications = {
      ...mockUser,
      emailNotifications: false,
      pushNotifications: false,
    };

    (prisma.treatment.findUnique as jest.Mock).mockResolvedValue({
      ...mockTreatment,
      schedule: { user: userWithoutNotifications },
    });

    await WeatherNotificationHandler.handleWeatherAlert(mockAlert);

    // Alert should still be saved
    expect(prisma.weatherAlert.create).toHaveBeenCalled();

    // But no notifications should be sent
    expect(NotificationService.sendEmailNotification).not.toHaveBeenCalled();
    expect(NotificationService.sendPushNotification).not.toHaveBeenCalled();
  });

  it('respects monitored conditions', async () => {
    const userWithLimitedMonitoring = {
      ...mockUser,
      monitoredConditions: ['wind'], // Only monitoring wind conditions
    };

    (prisma.treatment.findUnique as jest.Mock).mockResolvedValue({
      ...mockTreatment,
      schedule: { user: userWithLimitedMonitoring },
    });

    await WeatherNotificationHandler.handleWeatherAlert(mockAlert); // temperature alert

    // Alert should still be saved
    expect(prisma.weatherAlert.create).toHaveBeenCalled();

    // But no notifications should be sent for unmonitored condition
    expect(NotificationService.sendEmailNotification).not.toHaveBeenCalled();
    expect(NotificationService.sendPushNotification).not.toHaveBeenCalled();
  });

  it('handles missing treatment gracefully', async () => {
    (prisma.treatment.findUnique as jest.Mock).mockResolvedValue(null);

    await WeatherNotificationHandler.handleWeatherAlert(mockAlert);

    // Alert should still be saved
    expect(prisma.weatherAlert.create).toHaveBeenCalled();

    // But no notifications should be sent
    expect(NotificationService.sendEmailNotification).not.toHaveBeenCalled();
    expect(NotificationService.sendPushNotification).not.toHaveBeenCalled();
  });

  it('handles database errors without throwing', async () => {
    const error = new Error('Database connection failed');
    (prisma.weatherAlert.create as jest.Mock).mockRejectedValue(error);

    await expect(
      WeatherNotificationHandler.handleWeatherAlert(mockAlert)
    ).resolves.not.toThrow();

    // No notifications should be sent on error
    expect(NotificationService.sendEmailNotification).not.toHaveBeenCalled();
    expect(NotificationService.sendPushNotification).not.toHaveBeenCalled();
  });

  it('logs notification history', async () => {
    await WeatherNotificationHandler.handleWeatherAlert(mockAlert);

    // Verify notification history was created for both email and push
    expect(prisma.notificationHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'email',
          status: 'sent',
        }),
      })
    );

    expect(prisma.notificationHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'push',
          status: 'sent',
        }),
      })
    );
  });
});