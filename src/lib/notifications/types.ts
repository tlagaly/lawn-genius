import { WeatherAlert } from '@/lib/weather/types';

export interface BaseNotificationData {
  id: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  message: string;
}

export interface NotificationPayload extends BaseNotificationData {
  treatmentId: string;
  severity: string;
  suggestedDate: Date | null;
  emailSent: boolean;
  emailSentAt: Date | null;
  pushSent: boolean;
  pushSentAt: Date | null;
  readAt: Date | null;
  actionTaken: string | null;
}

export interface PushNotificationData {
  title: string;
  body: string;
  data: {
    type: string;
    alertId: string;
    treatmentId: string;
  };
}

export interface EmailNotificationData {
  subject: string;
  body: string;
  data: {
    type: string;
    alertId: string;
    treatmentId: string;
  };
}

// Service interfaces
export interface NotificationServiceInterface {
  sendPushNotification(userId: string, data: NotificationPayload): Promise<void>;
  sendEmailNotification(userId: string, data: NotificationPayload): Promise<void>;
}