#!/usr/bin/env node

/**
 * Overdue Invoice Updater
 *
 * This script can be run as a cron job to automatically update
 * the status of overdue invoices. Run this daily to keep invoice
 * statuses current.
 *
 * Usage:
 * node scripts/update-overdue-invoices.js
 *
 * Or add to crontab to run daily at midnight:
 * 0 0 * * * cd /path/to/your/app && node scripts/update-overdue-invoices.js
 */

const axios = require('axios');

async function updateOverdueInvoices() {
  try {
    const API_URL = process.env.API_URL || 'http://localhost:3000';

    console.log('🔍 Checking for overdue invoices...');

    const response = await axios.patch(`${API_URL}/invoice/overdue/update`);

    if (response.data && response.data.updated !== undefined) {
      const updatedCount = response.data.updated;

      if (updatedCount > 0) {
        console.log(`✅ Updated ${updatedCount} overdue invoice(s)`);

        // Optionally, you can send notification emails or log to a monitoring service
        // await sendNotificationToAdmin(updatedCount);
      } else {
        console.log('✅ No overdue invoices found');
      }
    }
  } catch (error) {
    console.error('❌ Error updating overdue invoices:', error.message);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }

    process.exit(1);
  }
}

// Run the script
updateOverdueInvoices()
  .then(() => {
    console.log('🎉 Overdue invoice update completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
