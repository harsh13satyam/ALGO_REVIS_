const DeliveryRecord = require('../models/DeliveryRecord');

/**
 * Formats WhatsApp text message body for Daily Challenge
 */
const buildWhatsAppMessageText = ({ userName, scheduledDate, questionA, questionB, clientUrl, challengeId }) => {
  const challengeUrl = `${clientUrl || 'http://localhost:5173'}?view=daily_challenge&challengeId=${challengeId}`;

  return `*AlgoRevis Daily Challenge • ${scheduledDate}*
Hi ${userName}! Here are your 2 coding challenges for today:

*1. Question A (Revision):*
*${questionA.name}* [${questionA.difficulty}]
Topic: ${questionA.pattern}
Open: ${challengeUrl}&q=A

*2. Question B (AI Generated):*
*${questionB.title}* [${questionB.difficulty}]
Topic: ${questionB.pattern}
Solve in Compiler: ${challengeUrl}&q=B

Complete both today in AlgoRevis to protect your revision streak!`;
};

/**
 * Sends Daily Challenge WhatsApp message via Meta Cloud API or mock mode
 */
const sendDailyChallengeWhatsApp = async (user, challenge) => {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  // 1. Consent, verification & preference checks
  if (!user.isPhoneVerified && process.env.NODE_ENV === 'production') {
    return { skipped: true, reason: 'Phone number has not been verified with OTP' };
  }
  if (!user.whatsappConsent || !user.deliveryPreferences?.whatsappEnabled) {
    return { skipped: true, reason: 'WhatsApp delivery disabled in user preferences' };
  }

  // 2. Stop sending if challenge already completed
  if (challenge.questionA?.completed && challenge.questionB?.completed) {
    return { skipped: true, reason: 'Daily challenge already completed by user' };
  }

  const rawPhone = user.phone || user.whatsappPhone || '';
  const recipient = rawPhone.replace(/[^\d]/g, '');
  if (!recipient || recipient.length < 8) {
    return { skipped: true, reason: 'No valid international WhatsApp phone number configured' };
  }

  const messageText = buildWhatsAppMessageText({
    userName: user.name,
    scheduledDate: challenge.scheduledDate,
    questionA: challenge.questionA,
    questionB: challenge.questionB,
    clientUrl,
    challengeId: challenge._id
  });

  const isMock = !phoneId || !accessToken || phoneId.startsWith('your_') || process.env.NODE_ENV === 'test';

  if (isMock) {
    console.log(`📱 [WhatsApp Mock] Message prepared for ${recipient}: "${challenge.questionA.name}" & "${challenge.questionB.title}"`);

    const record = new DeliveryRecord({
      user: user._id,
      challenge: challenge._id,
      channel: 'whatsapp',
      recipient,
      status: 'mock_sent',
      subjectOrSummary: `Daily Challenge ${challenge.scheduledDate}`,
      metadata: { mock: true, messageText }
    });
    await record.save();

    return { success: true, status: 'mock_sent', messageId: `mock-wa-${Date.now()}` };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: {
          preview_url: true,
          body: messageText
        }
      })
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error?.message || 'Meta WhatsApp Cloud API error');
    }

    const providerMessageId = data.messages?.[0]?.id || 'unknown';

    const record = new DeliveryRecord({
      user: user._id,
      challenge: challenge._id,
      channel: 'whatsapp',
      recipient,
      status: 'sent',
      subjectOrSummary: `Daily Challenge ${challenge.scheduledDate}`,
      providerMessageId,
      metadata: data
    });
    await record.save();

    return { success: true, status: 'sent', messageId: providerMessageId };
  } catch (err) {
    console.error(`❌ [WhatsApp Error] Delivery to ${recipient} failed:`, err.message);

    const record = new DeliveryRecord({
      user: user._id,
      challenge: challenge._id,
      channel: 'whatsapp',
      recipient,
      status: 'failed',
      subjectOrSummary: `Daily Challenge ${challenge.scheduledDate}`,
      error: err.message
    });
    await record.save();

    return { success: false, status: 'failed', error: err.message };
  }
};

module.exports = {
  sendDailyChallengeWhatsApp,
  buildWhatsAppMessageText
};
