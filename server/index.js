const express = require('express');
const twilio = require('twilio');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_APP_SID,
  TWILIO_CALLER_ID,
  PORT = 3000,
} = process.env;

// Generate a Twilio Voice access token for the mobile client
app.post('/token', (req, res) => {
  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: TWILIO_APP_SID,
    incomingAllow: false,
  });

  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY,
    TWILIO_API_SECRET,
    { identity: 'medlingua-user', ttl: 3600 }
  );
  token.addGrant(voiceGrant);

  res.json({ token: token.toJwt() });
});

// TwiML endpoint — called by Twilio when a call is initiated
app.post('/voice', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const to = req.body.To;

  if (to) {
    const dial = twiml.dial({ callerId: TWILIO_CALLER_ID });
    // Dial a PSTN number
    if (to.startsWith('+') || /^\d/.test(to)) {
      dial.number(to);
    } else {
      dial.client(to);
    }
  } else {
    twiml.say('No destination specified.');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Twilio backend listening on port ${PORT}`));
