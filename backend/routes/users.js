const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/database');

// Create or update user
router.post('/', async (req, res) => {
  try {
    const {
      email,
      name,
      studentId,
      userType,
      preferences = {}
    } = req.body;

    if (!email || !name || !userType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Update existing user
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update({
          name,
          student_id: studentId,
          user_type: userType,
          preferences,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        data: user,
        isNewUser: false
      });
    } else {
      // Create new user
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .insert({
          email,
          name,
          student_id: studentId,
          user_type: userType,
          preferences
        })
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        data: user,
        isNewUser: true
      });
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create/update user'
    });
  }
});

// Get user by email
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// Update user profile
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

// Get user's Pfand data
router.get('/:id/pfand', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: transactions, error } = await supabaseAdmin
      .from('pfand_transactions')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate totals
    const deposits = transactions.filter(t => t.transaction_type === 'deposit');
    const returns = transactions.filter(t => t.transaction_type === 'return');

    const totalDeposits = deposits.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalReturns = returns.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const cupsOutstanding = deposits.reduce((sum, t) => sum + t.cups_count, 0) - 
                           returns.reduce((sum, t) => sum + t.cups_count, 0);

    res.json({
      success: true,
      data: {
        cupsOutstanding: Math.max(0, cupsOutstanding),
        cupsReturned: returns.reduce((sum, t) => sum + t.cups_count, 0),
        totalDepositPaid: totalDeposits,
        totalDepositReturned: totalReturns,
        activity: transactions.map(t => ({
          type: t.transaction_type,
          amount: parseFloat(t.amount),
          cups: t.cups_count,
          description: t.description,
          date: t.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching Pfand data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Pfand data'
    });
  }
});

// Get user's favorites
router.get('/:id/favorites', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: favorites, error } = await supabaseAdmin
      .from('user_favorites')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: favorites
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch favorites'
    });
  }
});

// Add favorite
router.post('/:id/favorites', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, itemName, itemPrice } = req.body;

    const { data: favorite, error } = await supabaseAdmin
      .from('user_favorites')
      .insert({
        user_id: id,
        item_id: itemId,
        item_name: itemName,
        item_price: itemPrice
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: favorite
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add favorite'
    });
  }
});

// Remove favorite
router.delete('/:id/favorites/:itemId', async (req, res) => {
  try {
    const { id, itemId } = req.params;

    const { error } = await supabaseAdmin
      .from('user_favorites')
      .delete()
      .eq('user_id', id)
      .eq('item_id', itemId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Favorite removed'
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove favorite'
    });
  }
});

module.exports = router;
