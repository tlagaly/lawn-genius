import { NotificationService } from '@/lib/notifications';
import { prisma } from '@/lib/db/prisma';
import { Resend } from 'resend';

// Mock dependencies
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    notificationHistory: {
      create: jest.fn(),
    },
    weatherAlert: {
      update: jest.fn(),
    },
  },
}));

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    emailNotifications: true,
    pushNotifications: true,
    pushSubscription: JSON.stringify({
      endpoint: 'https://push.example.com',
      keys: { auth: 'auth-key', p256dh: 'p256dh-key' },
    }),
    notifyFrequency: 'immediate',
    monitoredConditions: ['temperature', 'wind'],
  };

  const mockAlert = {
    id: 'alert-1',
    treatmentId: 'treatment-1',
    type: 'temperature',
    severity: 'critical',
    message: 'Temperature is too high',
    suggestedDate: new Date('2025-03-07'),
    createdAt: new Date(),
    updatedAt: new Date(),
    emailSent: false,
    emailSentAt: null,
    pushSent: false,
    pushSentAt: null,
    readAt: null,
    actionTaken: null,
  };

  describe('sendEmailNotification', () => {
    it('should send and log email notification when enabled', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await NotificationService.sendEmailNotification(mockUser.id, mockAlert);

      // Verify email was sent
      expect(Resend.prototype.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Lawn Genius <notifications@lawngenius.app>',
          to: mockUser.email,
          subject: expect.stringContaining('Critical'),
          html: expect.stringContaining(mockAlert.message),
        })
      );

      // Verify notification was logged
      expect(prisma.notificationHistory.create).toHaveBeenCalledWith({
        data: {
          alertId: mockAlert.id,
          type: 'email',
          status: 'sent',
        },
      });

      // Verify alert was updated
      expect(prisma.weatherAlert.update).toHaveBeenCalledWith({
        where: { id: mockAlert.id },
        data: {
          emailSent: true,
          emailSentAt: expect.any(Date),
        },
      });
    });

    it('should not send email when notifications are disabled', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailNotifications: false,
      });

      await NotificationService.sendEmailNotification(mockUser.id, mockAlert);

      expect(Resend.prototype.emails.send).not.toHaveBeenCalled();
      expect(prisma.notificationHistory.create).not.toHaveBeenCalled();
      expect(prisma.weatherAlert.update).not.toHaveBeenCalled();
    });

    it('should handle email sending errors', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const error = new Error('Email sending failed');
      (Resend.prototype.emails.send as jest.Mock).mockRejectedValue(error);

      await expect(
        NotificationService.sendEmailNotification(mockUser.id, mockAlert)
      ).rejects.toThrow();

      expect(prisma.notificationHistory.create).toHaveBeenCalledWith({
        data: {
          alertId: mockAlert.id,
          type: 'email',
          status: 'failed',
          error: error.message,
        },
      });
    });
  });

  describe('sendPushNotification', () => {
    it('should send and log push notification when enabled', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await NotificationService.sendPushNotification(mockUser.id, mockAlert);

      // Verify notification was logged
      expect(prisma.notificationHistory.create).toHaveBeenCalledWith({
        data: {
          alertId: mockAlert.id,
          type: 'push',
          status: 'sent',
        },
      });

      // Verify alert was updated
      expect(prisma.weatherAlert.update).toHaveBeenCalledWith({
        where: { id: mockAlert.id },
        data: {
          pushSent: true,
          pushSentAt: expect.any(Date),
        },
      });
    });

    it('should not send push when notifications are disabled', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        pushNotifications: false,
      });

      await NotificationService.sendPushNotification(mockUser.id, mockAlert);

      expect(prisma.notificationHistory.create).not.toHaveBeenCalled();
      expect(prisma.weatherAlert.update).not.toHaveBeenCalled();
    });

    it('should not send push when subscription is missing', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        pushSubscription: null,
      });

      await NotificationService.sendPushNotification(mockUser.id, mockAlert);

      expect(prisma.notificationHistory.create).not.toHaveBeenCalled();
      expect(prisma.weatherAlert.update).not.toHaveBeenCalled();
    });
  });

  describe('sendNotification', () => {
    it('should send both email and push when both are enabled', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await NotificationService.sendNotification(mockUser.id, mockAlert);

      expect(prisma.notificationHistory.create).toHaveBeenCalledTimes(2);
      expect(prisma.weatherAlert.update).toHaveBeenCalledTimes(2);
    });

    it('should respect notification frequency settings', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        notifyFrequency: 'daily',
      });

      await NotificationService.sendNotification(mockUser.id, mockAlert);

      // Should not send immediate notifications for non-immediate frequency
      expect(prisma.notificationHistory.create).not.toHaveBeenCalled();
      expect(prisma.weatherAlert.update).not.toHaveBeenCalled();
    });

    it('should respect monitored conditions', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        monitoredConditions: ['wind'], // User only monitors wind
      });

      const temperatureAlert = {
        ...mockAlert,
        type: 'temperature', // Alert is for temperature
      };

      await NotificationService.sendNotification(mockUser.id, temperatureAlert);

      // Should not send notifications for unmonitored conditions
      expect(prisma.notificationHistory.create).not.toHaveBeenCalled();
      expect(prisma.weatherAlert.update).not.toHaveBeenCalled();
    });
  });
});