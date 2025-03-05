export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported');
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
}

export async function subscribeToPushNotifications(swRegistration: ServiceWorkerRegistration) {
  try {
    const response = await fetch('/api/notifications/vapid-key');
    const { publicKey } = await response.json();

    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });

    // Send subscription to server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    throw error;
  }
}

export async function unsubscribeFromPushNotifications(swRegistration: ServiceWorkerRegistration) {
  try {
    const subscription = await swRegistration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      
      // Notify server about unsubscription
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });
    }
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    throw error;
  }
}

export async function checkNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported');
  }

  // Check if permission is already granted
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission;
}

export async function setupPushNotifications() {
  try {
    const permission = await checkNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const registration = await registerServiceWorker();
    const subscription = await subscribeToPushNotifications(registration);
    return subscription;
  } catch (error) {
    console.error('Failed to setup push notifications:', error);
    throw error;
  }
}