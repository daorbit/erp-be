import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { ShiftReminderService } from './shiftReminder.service.js';
import { sendWhatsAppMessage } from '../../services/whatsapp.service.js';

/**
 * Twilio WhatsApp webhook handler.
 * Receives incoming WhatsApp messages and routes them to the shift reminder service.
 *
 * Configure this URL in your Twilio console:
 * POST https://your-domain.com/api/v1/webhooks/whatsapp
 */
export const handleWhatsAppWebhook = asyncHandler(async (req: Request, res: Response) => {
  // Twilio sends form-urlencoded data
  const { From, Body } = req.body;

  if (!From || !Body) {
    res.status(400).json({ error: 'Missing From or Body fields' });
    return;
  }

  console.log(`[Webhook] WhatsApp message from ${From}: ${Body}`);

  const replyText = await ShiftReminderService.handleWhatsAppReply(From, Body);

  // Send reply back to the user
  await sendWhatsAppMessage({
    to: From.replace('whatsapp:', ''),
    body: replyText,
  });

  // Twilio expects TwiML or 200 OK
  res.status(200).send('<Response></Response>');
});
