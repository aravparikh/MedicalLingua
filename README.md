# MedLingua

**Real-time medical translation for Spanish-speaking patients calling English-speaking US healthcare providers.**

> ⚠️ **Disclaimer:** MedLingua is a translation aid, not a medical device or certified interpreter service. Always confirm critical medical information directly with your healthcare provider.

---

## What It Does

MedLingua listens to a provider speaking English, transcribes it with OpenAI Whisper, translates it to Spanish via Claude, and displays both languages in a scrolling chat view. The patient can tap "Speak (ES)" to record a Spanish response — it gets transcribed, translated to English, and read aloud to the provider via text-to-speech. After the call ends, Claude generates a structured summary card (appointment, medications, follow-up instructions, key numbers). All data stays on-device.

---

## Architecture

```
┌────────────────────────────────────────────────┐
│              PROVIDER SIDE (EN)                │
│  Phone mic ──► Expo AV (7s chunks)             │
│                    │                           │
│                    ▼                           │
│           OpenAI Whisper API                   │
│           (speech → English text)              │
│                    │                           │
│                    ▼                           │
│           Anthropic Claude API                 │
│           claude-haiku-4-5                     │
│           (EN → ES, medical context)           │
│                    │                           │
│                    ▼                           │
│         Spanish displayed on screen            │
└────────────────────────────────────────────────┘
                     ▲
                     │  patient taps "Speak (ES)"
                     │
┌────────────────────────────────────────────────┐
│              PATIENT SIDE (ES)                 │
│  Phone mic ──► Expo AV (manual stop)           │
│                    │                           │
│                    ▼                           │
│           OpenAI Whisper API                   │
│           (speech → Spanish text, es mode)     │
│                    │                           │
│                    ▼                           │
│           Anthropic Claude API                 │
│           (ES → EN, medical context)           │
│                    │                           │
│                    ▼                           │
│       English displayed + Expo Speech TTS      │
└────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  AsyncStorage (device) │
        │  Full transcript       │
        │  + Claude summary card │
        └────────────────────────┘
```

---

## Folder Structure

```
Lingua/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Stack navigator root
│   ├── index.tsx           # Redirect → /home
│   ├── home.tsx            # Past calls list + Start Call
│   ├── call.tsx            # Live translation call screen
│   └── summary.tsx         # Post-call summary + transcript
│
├── components/
│   ├── DisclaimerBanner.tsx   # Yellow disclaimer shown on all screens
│   ├── TranscriptMessage.tsx  # Chat bubble (EN + ES together)
│   └── CallControls.tsx       # Listen / Speak (ES) / End Call buttons
│
├── services/
│   ├── whisper.ts          # OpenAI Whisper API wrapper
│   ├── claude.ts           # Anthropic Claude API (translate + summarize)
│   └── storage.ts          # AsyncStorage CRUD for CallRecords
│
├── types/
│   └── index.ts            # TranscriptEntry, CallRecord, CallSummary
│
├── utils/
│   ├── audio.ts            # startRecording / stopRecording (Expo AV)
│   └── format.ts           # formatTimestamp, formatDuration, generateId
│
├── assets/                 # Icons and splash screen
├── app.json                # Expo config (scheme: medlingua)
└── package.json
```

---

## Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm 9+** (comes with Node)
- **Expo Go** app on your phone — [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **OpenAI account** with API access (Whisper)
- **Anthropic account** with API access (Claude)

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd Lingua
npm install --cache /tmp/npm-cache   # use a temp cache if the default one has permission issues
```

### 2. Create your environment file

Create a file named `.env` in the project root:

```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

> **Security note:** `EXPO_PUBLIC_*` variables are embedded in the JS bundle at build time. This is fine for local dev and Expo Go testing. For a production release, route API calls through a backend proxy instead.

### 3. Start the dev server

```bash
npx expo start
```

You'll see a QR code in your terminal.

### 4. Open on your phone

1. Open the **Expo Go** app on your phone.
2. Scan the QR code from your terminal.
3. The app will bundle and launch — allow microphone permissions when prompted.

### 5. iOS Simulator / Android Emulator (optional)

```bash
npx expo start --ios      # requires Xcode on macOS
npx expo start --android  # requires Android Studio + emulator
```

---

## How to Use

1. **Home screen** — tap **Start Call** to begin a new translated call.
2. **Call screen:**
   - Tap **Listen** (🎙) — app records the provider in 7-second chunks, transcribes with Whisper, translates to Spanish, and displays both.
   - Tap **Stop** to flush the current chunk immediately.
   - Tap **Speak (ES)** (💬) — patient speaks Spanish; tap **Done** when finished. The Spanish is transcribed and translated to English. Tap **🔊 Play English aloud** to have the translation read out.
   - Tap **End Call** (📵) — saves the call and goes to the Summary screen.
3. **Summary screen** — Claude makes a second pass to extract appointment time, medications, follow-up instructions, and key phone numbers into a card.

---

## API Cost Estimates (rough)

| Operation | Model | Est. cost per call |
|-----------|-------|-------------------|
| Whisper transcription | whisper-1 | ~$0.003/min of audio |
| EN→ES translation | claude-haiku-4-5 | ~$0.001–0.003/chunk |
| ES→EN translation | claude-haiku-4-5 | ~$0.001–0.003/response |
| Call summary | claude-haiku-4-5 | ~$0.005–0.01/call |

A typical 10-minute call costs roughly **$0.05–$0.15** in API fees.

---

## Known Limitations / What to Build Next

See the "What's next" section below for the prioritized backlog.

---

## Development Notes

- **npm cache permission errors** on macOS: run `sudo chown -R $(whoami) ~/.npm` once to fix permanently, or always install with `npm install --cache /tmp/npm-cache`.
- **Microphone on iOS Simulator**: the simulator doesn't support the mic. Use a real device via Expo Go.
- **New Architecture**: `newArchEnabled: true` in app.json. All packages in this scaffold are compatible.
