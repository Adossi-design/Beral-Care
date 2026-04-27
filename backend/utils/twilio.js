let twilio;
try {
  twilio = require("twilio");
} catch (error) {
  twilio = null;
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const hasValidTwilioConfig =
  twilio &&
  typeof accountSid === "string" &&
  accountSid.startsWith("AC") &&
  typeof authToken === "string" &&
  authToken.trim() !== "" &&
  typeof twilioPhoneNumber === "string" &&
  twilioPhoneNumber.trim() !== "";

const client = hasValidTwilioConfig ? twilio(accountSid, authToken) : null;

const sendSms = async (to, body) => {
  try {
    if (!client || !twilioPhoneNumber) {
      console.log(`SMS skipped for ${to}: Twilio is not configured.`);
      return;
    }

    await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to,
    });
    console.log(`SMS sent to ${to}`);
  } catch (error) {
    console.error(`Error sending SMS: ${error.message}`);
  }
};

module.exports = { sendSms };
