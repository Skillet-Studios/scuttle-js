const cron = require('node-cron');
const { sendWeeklyReports } = require('./tasks/reports');

/**
 * Starts all scheduled tasks for the bot.
 *
 * Tasks included:
 * - Weekly reports: Runs every Sunday at 4:00 PM EST.
 */
function startScheduledJobs(client) {
  console.log('⏳ Initializing Scheduled Jobs...');

  // ⏰ Weekly Reports - Runs every Sunday at 4:00 PM EST (8:00 PM UTC)
  cron.schedule(
    '0 20 * * 0',
    () => {
      console.log('📊 [SCHEDULED TASK] Running Weekly Reports...');
      sendWeeklyReports(client);
    },
    {
      timezone: 'America/New_York',
    }
  );

  console.log('✅ Scheduled Jobs Initialized.');
}

module.exports = { startScheduledJobs };
