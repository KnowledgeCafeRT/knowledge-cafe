const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/database');
const { sendOrderReadyNotification } = require('../services/notifications');

// Get all orders (for internal display)
router.get('/', async (req, res) => {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          student_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      pfandDeposit,
      total,
      scheduling,
      notes,
      userId
    } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !items || !total) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Create order
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId || null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        items: items,
        subtotal: subtotal,
        pfand_deposit: pfandDeposit || 0,
        total: total,
        scheduling: scheduling,
        notes: notes,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // If user is logged in, update their stats
    if (userId) {
      await updateUserStats(userId, total);
    }

    // Create Pfand transactions if applicable
    if (pfandDeposit > 0) {
      await createPfandTransaction(userId, order.id, 'deposit', 
        items.filter(item => item.pfand).length, pfandDeposit);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'preparing', 'ready', 'collected', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .single();

    if (error) throw error;

    // Send notification if order is ready
    if (status === 'ready' && order.user_id) {
      await sendOrderReadyNotification(order.user_id, order);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
});

// Get user's order history
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user orders'
    });
  }
});

// Helper function to update user stats
async function updateUserStats(userId, orderTotal) {
  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('loyalty_visits, total_spent')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const newTotalSpent = (user.total_spent || 0) + orderTotal;
    const newLoyaltyVisits = (user.loyalty_visits || 0) + 1;

    await supabaseAdmin
      .from('users')
      .update({
        loyalty_visits: newLoyaltyVisits,
        total_spent: newTotalSpent,
        rewards_earned: Math.floor(newLoyaltyVisits / 10)
      })
      .eq('id', userId);
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

// Helper function to create Pfand transaction
async function createPfandTransaction(userId, orderId, type, cupsCount, amount) {
  try {
    await supabaseAdmin
      .from('pfand_transactions')
      .insert({
        user_id: userId,
        order_id: orderId,
        transaction_type: type,
        cups_count: cupsCount,
        amount: amount,
        description: `${type === 'deposit' ? 'Paid' : 'Returned'} deposit for ${cupsCount} cup${cupsCount > 1 ? 's' : ''}`
      });
  } catch (error) {
    console.error('Error creating Pfand transaction:', error);
  }
}

module.exports = router;
