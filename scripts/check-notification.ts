const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNotificationHistory() {
  try {
    // Get the most recent notification history
    const history = await prisma.notificationHistory.findMany({
      orderBy: { sentAt: 'desc' },
      take: 1,
      include: {
        alert: {
          include: {
            treatment: true
          }
        }
      }
    });

    if (history.length > 0) {
      const notification = history[0];
      console.log('Most Recent Notification:');
      console.log('Status:', notification.status);
      console.log('Type:', notification.type);
      console.log('Sent At:', notification.sentAt);
      console.log('Alert Type:', notification.alert.type);
      console.log('Alert Severity:', notification.alert.severity);
      console.log('Alert Message:', notification.alert.message);
      if (notification.error) {
        console.log('Error:', notification.error);
      }
    } else {
      console.log('No notification history found');
    }
  } catch (error) {
    console.error('Error checking notification history:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotificationHistory();