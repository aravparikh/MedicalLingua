import { Voice, Call } from '@twilio/voice-react-native-sdk';

const BACKEND = 'https://joyful-manifestation-production.up.railway.app';

let _voice: Voice | null = null;
let _activeCall: Call | null = null;

function getVoice(): Voice {
  if (!_voice) _voice = new Voice();
  return _voice;
}

export async function fetchToken(): Promise<string> {
  const res = await fetch(`${BACKEND}/token`, { method: 'POST' });
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
  const { token } = await res.json();
  return token;
}

export async function startCall(to: string): Promise<Call> {
  const token = await fetchToken();
  const voice = getVoice();
  await voice.register(token);
  const call = await voice.connect(token, {
    params: { To: to.replace(/\D/g, '').replace(/^/, '+1') },
  });
  _activeCall = call;
  return call;
}

export function getActiveCall(): Call | null {
  return _activeCall;
}

export async function hangUp(): Promise<void> {
  if (_activeCall) {
    await _activeCall.disconnect();
    _activeCall = null;
  }
}

export async function setMuted(muted: boolean): Promise<void> {
  if (_activeCall) await _activeCall.mute(muted);
}
