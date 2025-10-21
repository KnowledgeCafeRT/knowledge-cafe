const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/database');
const { sendPushNotification } = require('../services/notifications');

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const {
      userId,
      endpoint,
      p256dhKey,
      authKey
    } = req.body;

    if (!userId || !endpoint || !p256dhKey || !authKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required subscription data'
      });
    }

    // Check if subscription already exists
    const { data: existing } = await supabaseAdmin
      .from('notification_subscriptions')
      .select('id')
      .eq('endpoint', endpoint)
      .single();

    if (existing) {
      // Update existing subscription
      const { error } = await supabaseAdmin
        .from('notification_subscriptions')
        .update({
          user_id: userId,
          p256dh_key: p256dhKey,
          auth_key: authKey,
          created_at: new Date().toISOString()
        })
        .eq('endpoint', endpoint);

      if (error) throw error;
    } else {
      // Create new subscription
      const { error } = await supabaseAdmin
        .from('notification_subscriptions')
        .insert({
          user_id: userId,
          endpoint,
          p256dh_key: p256dhKey,
          auth_key: authKey
        });

      if (error) throw error;
    }

    res.json({
      success: true,
      message: 'Successfully subscribed to notifications'
    });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to notifications'
    });
  }
});

// Unsubscribe from push notifications
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Missing endpoint'
      });
    }

    const { error } = await supabaseAdmin
      .from('notification_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Successfully unsubscribed from notifications'
    });
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe from notifications'
    });
  }
});

// Get VAPID public key
router.get('/vapid-key', (req, res) => {
  res.json({
    success: true,
    data: {
      publicKey: process.env.VAPID_PUBLIC_KEY
    }
  });
});

// Send test notification (for testing purposes)
router.post('/test', async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing user ID'
      });
    }

    await sendPushNotification(userId, {
      title: 'Test Notification',
      body: message || 'This is a test notification from Knowledge Cafe!',
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });

    res.json({
      success: true,
      message: 'Test notification sent'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
});

module.exports = router;
