import { processPendingReminders } from '../services/notificationService.js';

let intervalId = null;

export const startReminderScheduler = (intervalMs = 60000) => {
  if (intervalId) return;

  console.log('[Scheduler] Background reminder & deadline alert scheduler started (Interval: 60s).');

  // Run initial check immediately
  processPendingReminders().catch((err) =>
    console.warn('[Scheduler Error]', err.message)
  );

  // Set recurring interval
  intervalId = setInterval(async () => {
    try {
      await processPendingReminders();
    } catch (err) {
      console.warn('[Scheduler Error]', err.message);
    }
  }, intervalMs);
};

export const stopReminderScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Scheduler] Background reminder scheduler stopped.');
  }
};
