const User = require('../models/User');
const DailyChallenge = require('../models/DailyChallenge');
const { selectRevisionProblem } = require('./revisionService');
const { generateSimilarQuestion } = require('./aiService');
const { sendDailyChallengeEmail, sendStreakReminderEmail } = require('./emailService');
const { sendDailyChallengeWhatsApp } = require('./whatsappService');

/**
 * Returns formatted date string 'YYYY-MM-DD' for a given timezone
 */
const getLocalDateString = (timezone = 'UTC') => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date()); // Formats as YYYY-MM-DD
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Returns current 'HH:mm' string for a given timezone
 */
const getLocalTimeString = (timezone = 'UTC') => {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    return `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
  }
};

/**
 * Atomically generates or retrieves the Daily Challenge for a user and date
 * Idempotent: Guarantees exactly one challenge per user per scheduled date.
 */
const getOrCreateDailyChallenge = async (user, scheduledDate = null) => {
  const date = scheduledDate || getLocalDateString(user.deliveryPreferences?.timezone || 'UTC');

  // 1. Look for existing challenge
  let challenge = await DailyChallenge.findOne({ user: user._id, scheduledDate: date });
  if (challenge) {
    return challenge;
  }

  // 2. Select Question A (Revision)
  const questionAProblem = await selectRevisionProblem(user);

  // 3. Generate Question B (AI similar question)
  const aiQuestion = await generateSimilarQuestion(
    questionAProblem.pattern,
    questionAProblem.difficulty,
    questionAProblem.name
  );

  // 4. Save new challenge with concurrency-safe duplicate key handling
  try {
    challenge = new DailyChallenge({
      user: user._id,
      scheduledDate: date,
      questionA: {
        problemId: questionAProblem._id,
        name: questionAProblem.name,
        link: questionAProblem.link || '',
        pattern: questionAProblem.pattern || 'General',
        difficulty: questionAProblem.difficulty || 'Medium',
        notes: questionAProblem.notes || '',
        completed: false,
        source: 'revision'
      },
      questionB: {
        title: aiQuestion.title,
        statement: aiQuestion.statement,
        difficulty: aiQuestion.difficulty || 'Medium',
        pattern: aiQuestion.pattern || questionAProblem.pattern,
        constraints: aiQuestion.constraints || [],
        examples: aiQuestion.examples || [],
        testCases: aiQuestion.testCases || [],
        referenceSolution: aiQuestion.referenceSolution || '',
        explanation: aiQuestion.explanation || '',
        completed: false,
        source: 'ai'
      },
      deliveryStatus: {
        email: { status: user.deliveryPreferences?.emailEnabled ? 'pending' : 'disabled' },
        reminderEmail: { status: user.deliveryPreferences?.reminderEmailEnabled !== false ? 'pending' : 'disabled' },
        whatsapp: { status: user.deliveryPreferences?.whatsappEnabled ? 'pending' : 'disabled' }
      }
    });

    await challenge.save();
    return challenge;
  } catch (err) {
    // If concurrent worker saved it first (E11000 duplicate key error)
    if (err.code === 11000) {
      return DailyChallenge.findOne({ user: user._id, scheduledDate: date });
    }
    throw err;
  }
};

/**
 * Dispatches challenge to user via Email and WhatsApp independently
 */
const deliverChallenge = async (user, challenge, options = {}) => {
  const results = { email: null, reminderEmail: null, whatsapp: null };

  // 1. Evening streak reminder dispatch (2nd email of the day)
  if (options.reminder) {
    if (user.deliveryPreferences?.emailEnabled && user.deliveryPreferences?.reminderEmailEnabled !== false) {
      try {
        const remRes = await sendStreakReminderEmail(user, challenge);
        challenge.deliveryStatus.reminderEmail = {
          status: remRes.status || (remRes.skipped ? 'skipped' : 'failed'),
          sentAt: remRes.success ? new Date() : null,
          messageId: remRes.messageId || null,
          error: remRes.error || null
        };
        results.reminderEmail = remRes;
      } catch (e) {
        console.error('Streak reminder dispatcher error:', e);
        challenge.deliveryStatus.reminderEmail = { status: 'failed', error: e.message };
        results.reminderEmail = { success: false, error: e.message };
      }
    }
    await challenge.save();
    return results;
  }

  // 2. Primary Morning Challenge Email delivery
  if (user.deliveryPreferences?.emailEnabled && challenge.deliveryStatus?.email?.status !== 'sent') {
    try {
      const emailRes = await sendDailyChallengeEmail(user, challenge);
      challenge.deliveryStatus.email = {
        status: emailRes.status || (emailRes.skipped ? 'disabled' : 'failed'),
        sentAt: emailRes.success ? new Date() : null,
        messageId: emailRes.messageId || null,
        error: emailRes.error || null
      };
      results.email = emailRes;
    } catch (e) {
      console.error('Email dispatcher error:', e);
      challenge.deliveryStatus.email = { status: 'failed', error: e.message };
      results.email = { success: false, error: e.message };
    }
  }

  // 3. WhatsApp delivery (completely isolated from email)
  if (user.deliveryPreferences?.whatsappEnabled && challenge.deliveryStatus?.whatsapp?.status !== 'sent') {
    try {
      const waRes = await sendDailyChallengeWhatsApp(user, challenge);
      challenge.deliveryStatus.whatsapp = {
        status: waRes.status || (waRes.skipped ? 'disabled' : 'failed'),
        sentAt: waRes.success ? new Date() : null,
        messageId: waRes.messageId || null,
        error: waRes.error || null
      };
      results.whatsapp = waRes;
    } catch (e) {
      console.error('WhatsApp dispatcher error:', e);
      challenge.deliveryStatus.whatsapp = { status: 'failed', error: e.message };
      results.whatsapp = { success: false, error: e.message };
    }
  }

  await challenge.save();
  return results;
};

/**
 * Scheduled check: evaluates users whose preferred delivery times have arrived (2 emails/day)
 */
const runSchedulerTick = async () => {
  try {
    const users = await User.find({
      $or: [
        { 'deliveryPreferences.emailEnabled': true },
        { 'deliveryPreferences.reminderEmailEnabled': true },
        { 'deliveryPreferences.whatsappEnabled': true }
      ]
    });

    for (const user of users) {
      const tz = user.deliveryPreferences?.timezone || 'UTC';
      const morningTime = user.deliveryPreferences?.time || '09:00';
      const reminderTime = user.deliveryPreferences?.reminderTime || '19:00';
      const currentTime = getLocalTimeString(tz);
      const currentDate = getLocalDateString(tz);

      // --- EMAIL 1: Morning Daily Release (at or after morningTime) ---
      if (currentTime >= morningTime) {
        const existing = await DailyChallenge.findOne({ user: user._id, scheduledDate: currentDate });
        
        const needsEmail = user.deliveryPreferences?.emailEnabled && 
          (!existing || ['pending', 'failed'].includes(existing.deliveryStatus?.email?.status));
        const needsWhatsApp = user.deliveryPreferences?.whatsappEnabled && 
          (!existing || ['pending', 'failed'].includes(existing.deliveryStatus?.whatsapp?.status));

        if (!existing || needsEmail || needsWhatsApp) {
          console.log(`⏰ [Scheduler] Triggering morning delivery for ${user.email} (${currentDate} ${tz})`);
          const challenge = await getOrCreateDailyChallenge(user, currentDate);
          await deliverChallenge(user, challenge);
        }
      }

      // --- EMAIL 2: Evening Streak Reminder (at or after reminderTime) ---
      if (currentTime >= reminderTime && user.deliveryPreferences?.emailEnabled && user.deliveryPreferences?.reminderEmailEnabled !== false) {
        const existing = await DailyChallenge.findOne({ user: user._id, scheduledDate: currentDate });
        if (existing) {
          const isCompleted = existing.questionA?.completed && existing.questionB?.completed;
          if (isCompleted) {
            // If already completed, ensure it is recorded as skipped so we don't nag
            if (existing.deliveryStatus?.reminderEmail?.status !== 'skipped' && existing.deliveryStatus?.reminderEmail?.status !== 'sent') {
              existing.deliveryStatus.reminderEmail = { status: 'skipped', error: 'Daily challenge already completed by user' };
              await existing.save();
            }
          } else {
            // Still pending! Send evening reminder if not yet sent
            const needsReminder = !existing.deliveryStatus?.reminderEmail || 
              ['pending', 'failed'].includes(existing.deliveryStatus?.reminderEmail?.status);

            if (needsReminder) {
              console.log(`⏰ [Scheduler] Triggering evening streak reminder for ${user.email} (${currentDate} ${tz})`);
              await deliverChallenge(user, existing, { reminder: true });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ [Scheduler] Error during scheduler tick:', err.message);
  }
};

/**
 * Dev simulation trigger: immediately generates and dispatches challenge for user
 */
const simulateDailyDelivery = async (user, options = {}) => {
  const tz = user.deliveryPreferences?.timezone || 'UTC';
  const currentDate = getLocalDateString(tz);

  const challenge = await getOrCreateDailyChallenge(user, currentDate);
  const deliveryResults = await deliverChallenge(user, challenge, options);

  return {
    challenge,
    deliveryResults,
    simulatedDate: currentDate
  };
};

let schedulerTimer = null;

const startScheduler = (intervalMs = 60000) => {
  if (schedulerTimer) return;
  console.log(`⏱️ [Scheduler] Background scheduler initialized (interval: ${intervalMs}ms)`);
  // Run initial tick after 5 seconds to recover any missed deliveries on restart
  setTimeout(() => runSchedulerTick(), 5000);
  schedulerTimer = setInterval(runSchedulerTick, intervalMs);
};

const stopScheduler = () => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
};

module.exports = {
  getOrCreateDailyChallenge,
  deliverChallenge,
  simulateDailyDelivery,
  runSchedulerTick,
  startScheduler,
  stopScheduler,
  getLocalDateString,
  getLocalTimeString
};
