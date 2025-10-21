const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/database');

// Process Pfand cup return (staff only)
router.post('/return', async (req, res) => {
  try {
    const {
      userId,
      cupsCount,
      processedBy = 'Staff'
    } = req.body;

    if (!userId || !cupsCount || cupsCount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid return data'
      });
    }

    // Get user's current Pfand data
    const { data: userPfand } = await supabaseAdmin
      .from('pfand_transactions')
      .select('*')
      .eq('user_id', userId);

    if (!userPfand) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calculate outstanding cups
    const deposits = userPfand.filter(t => t.transaction_type === 'deposit');
    const returns = userPfand.filter(t => t.transaction_type === 'return');
    const outstandingCups = deposits.reduce((sum, t) => sum + t.cups_count, 0) - 
                           returns.reduce((sum, t) => sum + t.cups_count, 0);

    if (cupsCount > outstandingCups) {
      return res.status(400).json({
        success: false,
        error: `Cannot return ${cupsCount} cups. User only has ${outstandingCups} outstanding.`
      });
    }

    const refundAmount = cupsCount * 2.00; // €2.00 per cup

    // Create return transaction
    const { data: transaction, error } = await supabaseAdmin
      .from('pfand_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'return',
        cups_count: cupsCount,
        amount: refundAmount,
        description: `Returned ${cupsCount} cup${cupsCount > 1 ? 's' : ''} - processed by ${processedBy}`,
        processed_by: processedBy
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        transaction,
        refundAmount,
        remainingCups: outstandingCups - cupsCount
      }
    });
  } catch (error) {
    console.error('Error processing Pfand return:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process return'
    });
  }
});

// Get all customers with outstanding Pfand cups
router.get('/outstanding', async (req, res) => {
  try {
    const { data: transactions, error } = await supabaseAdmin
      .from('pfand_transactions')
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

    // Group by user and calculate outstanding cups
    const userPfandMap = new Map();

    transactions.forEach(transaction => {
      const userId = transaction.user_id;
      if (!userPfandMap.has(userId)) {
        userPfandMap.set(userId, {
          user: transaction.users,
          deposits: 0,
          returns: 0,
          lastActivity: transaction.created_at
        });
      }

      const userData = userPfandMap.get(userId);
      if (transaction.transaction_type === 'deposit') {
        userData.deposits += transaction.cups_count;
      } else {
        userData.returns += transaction.cups_count;
      }
    });

    // Filter users with outstanding cups
    const outstandingUsers = Array.from(userPfandMap.entries())
      .map(([userId, data]) => ({
        userId,
        ...data,
        outstandingCups: Math.max(0, data.deposits - data.returns),
        totalDepositValue: (data.deposits - data.returns) * 2.00
      }))
      .filter(user => user.outstandingCups > 0)
      .sort((a, b) => b.outstandingCups - a.outstandingCups);

    res.json({
      success: true,
      data: outstandingUsers
    });
  } catch (error) {
    console.error('Error fetching outstanding Pfand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch outstanding Pfand data'
    });
  }
});

// Get Pfand statistics
router.get('/stats', async (req, res) => {
  try {
    const { data: transactions, error } = await supabaseAdmin
      .from('pfand_transactions')
      .select('*');

    if (error) throw error;

    const deposits = transactions.filter(t => t.transaction_type === 'deposit');
    const returns = transactions.filter(t => t.transaction_type === 'return');

    const totalCupsOutstanding = deposits.reduce((sum, t) => sum + t.cups_count, 0) - 
                                returns.reduce((sum, t) => sum + t.cups_count, 0);
    const totalDepositValue = totalCupsOutstanding * 2.00;
    const customersWithCups = new Set(deposits.map(t => t.user_id)).size;

    res.json({
      success: true,
      data: {
        totalCupsOutstanding: Math.max(0, totalCupsOutstanding),
        totalDepositValue,
        customersWithCups,
        totalCupsReturned: returns.reduce((sum, t) => sum + t.cups_count, 0),
        totalRefundsIssued: returns.reduce((sum, t) => sum + parseFloat(t.amount), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching Pfand stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Pfand statistics'
    });
  }
});

module.exports = router;
