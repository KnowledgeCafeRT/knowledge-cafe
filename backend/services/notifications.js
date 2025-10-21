const webpush = require('web-push');
const { supabaseAdmin } = require('../config/database');

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Send push notification to a specific user
async function sendPushNotification(userId, payload) {
  try {
    // Get user's subscription
    const { data: subscriptions, error } = await supabaseAdmin
      .from('notification_subscriptions')
      .select('endpoint, p256dh_key, auth_key')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return false;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for user:', userId);
      return false;
    }

    // Send notification to all user's subscriptions
    const promises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        };

        await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
        console.log('Push notification sent successfully');
        return true;
      } catch (error) {
        console.error('Error sending push notification:', error);
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
          await supabaseAdmin
            .from('notification_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint);
        }
        
        return false;
      }
    });

    const results = await Promise.all(promises);
    return results.some(result => result === true);
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return false;
  }
}

// Send order ready notification
async function sendOrderReadyNotification(userId, order) {
  const payload = {
    title: 'Order Ready! ☕',
    body: `Your order #${order.id.slice(-6)} is ready for pickup`,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      orderId: order.id,
      url: `/tracking.html?order=${order.id}`
    },
    actions: [
      {
        action: 'view',
        title: 'View Order',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  };

  return await sendPushNotification(userId, payload);
}

// Send general notification to all users
async function sendBroadcastNotification(payload) {
  try {
    const { data: subscriptions, error } = await supabaseAdmin
      .from('notification_subscriptions')
      .select('endpoint, p256dh_key, auth_key');

    if (error) {
      console.error('Error fetching all subscriptions:', error);
      return false;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found');
      return false;
    }

    const promises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        };

        await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
        return true;
      } catch (error) {
        console.error('Error sending broadcast notification:', error);
        
        // Remove invalid subscriptions
        if (error.statusCode === 410) {
          await supabaseAdmin
            .from('notification_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint);
        }
        
        return false;
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(result => result === true).length;
    
    console.log(`Broadcast notification sent to ${successCount}/${subscriptions.length} users`);
    return successCount > 0;
  } catch (error) {
    console.error('Error in sendBroadcastNotification:', error);
    return false;
  }
}

module.exports = {
  sendPushNotification,
  sendOrderReadyNotification,
  sendBroadcastNotification
};
