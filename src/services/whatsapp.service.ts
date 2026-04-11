import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox default

let client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio | null {
  if (!accountSid || !authToken) {
    console.warn('[WhatsApp] Twilio credentials not configured. Messages will be logged only.');
    return null;
  }
  if (!client) {
    client = twilio(accountSid, authToken);
  }
  return client;
}

export interface WhatsAppMessage {
  to: string;   // Phone number with country code (e.g., "+919876543210")
  body: string;
}

/**
 * Send a WhatsApp message via Twilio.
 * Falls back to console logging if Twilio is not configured.
 */
export async function sendWhatsAppMessage(msg: WhatsAppMessage): Promise<boolean> {
  const twilioClient = getClient();

  if (!twilioClient) {
    console.log(`[WhatsApp][DRY-RUN] To: ${msg.to} | Message: ${msg.body}`);
    return true;
  }

  try {
    await twilioClient.messages.create({
      from: fromNumber,
      to: `whatsapp:${msg.to}`,
      body: msg.body,
    });
    console.log(`[WhatsApp] Sent to ${msg.to}`);
    return true;
  } catch (error) {
    console.error(`[WhatsApp] Failed to send to ${msg.to}:`, error);
    return false;
  }
}

/**
 * Send shift start reminder.
 */
export async function sendShiftReminder(phone: string, employeeName: string, shiftName: string, startTime: string): Promise<boolean> {
  return sendWhatsAppMessage({
    to: phone,
    body: `Hi ${employeeName}, your shift "${shiftName}" started at ${startTime}. Please check in to the attendance system.`,
  });
}

/**
 * Send leave inquiry after grace period.
 */
export async function sendLeaveInquiry(phone: string, employeeName: string, shiftName: string): Promise<boolean> {
  return sendWhatsAppMessage({
    to: phone,
    body: `Hi ${employeeName}, you haven't checked in for your "${shiftName}" shift. Are you on leave today?\n\nReply *YES* to apply for leave\nReply *NO* if you're coming in`,
  });
}
