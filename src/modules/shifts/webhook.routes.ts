import { Router } from 'express';
import { handleWhatsAppWebhook } from './webhook.controller.js';

const router = Router();

// WhatsApp webhook — no auth required (Twilio calls this)
// You should add Twilio request validation in production
router.post('/whatsapp', handleWhatsAppWebhook);

export default router;
