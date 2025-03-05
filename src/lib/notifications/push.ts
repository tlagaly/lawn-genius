import webpush from 'web-push';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:support@lawngenius.app',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(subscription: PushSubscription, payload: any) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

// Generate VAPID keys - use this once to generate keys and add them to .env
export function generateVapidKeys() {
  const vapidKeys = webpush.generateVAPIDKeys();
  return {
    publicKey: vapidKeys.publicKey,
    privateKey: vapidKeys.privateKey,
  };
}