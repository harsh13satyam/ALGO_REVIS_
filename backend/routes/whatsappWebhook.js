const express = require('express');
const router = express.Router();
const DeliveryRecord = require('../models/DeliveryRecord');

// GET /api/whatsapp/webhook - Meta Cloud API webhook verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'algorevis_wa_verify_token';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ [WhatsApp Webhook] Verification successful');
    return res.status(200).send(challenge);
  }

  console.warn('❌ [WhatsApp Webhook] Verification failed: token mismatch');
  return res.sendStatus(403);
});

// POST /api/whatsapp/webhook - Status updates from Meta
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value;
          const statuses = value?.statuses || [];

          for (const statusObj of statuses) {
            const messageId = statusObj.id;
            const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'

            console.log(`📱 [WhatsApp Status Update] Message ID ${messageId}: status=${status}`);

            // Update matching delivery record
            await DeliveryRecord.updateOne(
              { providerMessageId: messageId },
              {
                $set: {
                  status: status === 'delivered' || status === 'read' ? 'delivered' : (status === 'failed' ? 'failed' : 'sent'),
                  'metadata.latestStatus': status,
                  'metadata.statusTimestamp': statusObj.timestamp
                }
              }
            );
          }
        }
      }
    }

    // Always respond 200 OK to Meta
    res.status(200).send('EVENT_RECEIVED');
  } catch (err) {
    console.error('Error handling WhatsApp webhook:', err);
    res.status(200).send('EVENT_RECEIVED');
  }
});

module.exports = router;
