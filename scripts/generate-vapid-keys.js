const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\nVAPID Keys generated successfully!\n');
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"\n`);