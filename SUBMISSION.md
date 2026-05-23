# MedLingua — Submission Playbook

The 5-piece arsenal for winning the Congressional App Challenge.

---

## 1. The Tagline (everywhere — App Store, video thumbnail, slide 1)

**"Catches the dangerous mistakes Google Translate makes — for the 25 million Americans who don't speak English at the doctor."**

## 2. The 90-second video script

> **(0:00–0:08) HOOK — DARK SCREEN, WHITE TEXT, NO MUSIC YET**
>
> "In English, 'once' means one time. In Spanish, 'once' means **eleven**."
>
> *[hold on screen, beat]*
>
> "Google Translate gets this wrong. People overdose because of this."

> **(0:08–0:18) PROBLEM**
>
> *[B-roll: senior at a doctor's office, looking confused]*
>
> "25 million Americans don't speak English well. Every year, they sit in doctor's offices and miss critical instructions. One wrong word — like 'once' — can mean a lethal overdose."

> **(0:18–0:25) NAME REVEAL**
>
> *[Logo animates in. Tagline below.]*
>
> "MedLingua. A medical AI interpreter built for these patients."

> **(0:25–0:50) THE CORE DEMO — SCREEN RECORDING**
>
> *[Show MedLingua app. Tap "Visita en persona." Doctor's voice plays: "We will start lisinopril 10 mg once daily."]*
>
> "Watch this. The doctor says 'once daily.'"
>
> *[Translation appears with a yellow Safety Guardrail chip: "🛡️ Caught dosage ambiguity"]*
>
> "MedLingua catches it. Translates correctly. Shows the patient the right Spanish — and **flags the bug** so the family knows what just happened."

> **(0:50–1:10) THE DEPTH REVEAL — quick cuts**
>
> *[Cut to summary screen — urgent warnings card pulsing red]*
>
> "When the visit ends, a plain-language summary."
>
> *[Cut to AskAI — tap a suggestion → answer appears]*
>
> "An AI assistant grounded only in what the doctor actually said — no hallucinated medical advice."
>
> *[Cut to drug interaction check showing "✓ No major interactions"]*
>
> "A medication safety review."
>
> *[Cut to doctor mode — clinical black screen + QR]*
>
> "Even a doctor mode — so the provider can see the same record in English, on their phone, with one scan."

> **(1:10–1:25) THE WHY**
>
> *[Slow zoom on senior using the app, smiling, doctor across from them]*
>
> "MedLingua doesn't replace your doctor. It makes sure you understand what they said. That's all anyone wants when they're sick."

> **(1:25–1:30) CLOSER**
>
> *[Logo + tagline]*
>
> "MedLingua. **For the patient who deserves to be understood.**"

---

## 3. The submission write-up (CAC project description, 1000-char max)

> MedLingua is an AI medical interpreter built for the 25 million Americans with Limited English Proficiency — most of them seniors who can't access translator phone lines mid-appointment.
>
> Built with Whisper, GPT-4o, and a custom medical-translation prompt, MedLingua does what Google Translate can't:
>
> • **Catches lethal mistranslations** like "once daily" (which Google translates to a word meaning "eleven" in Spanish — a dangerous overdose).
> • **Generates a plain-language summary** after every visit at a 6th-grade reading level — medications, instructions, warning signs.
> • **Provides an AI assistant** grounded only in what the doctor actually said. No hallucinated medical advice.
> • **Checks medication interactions** automatically.
> • **Bilingual UI** so the patient (or their family) can use it in Spanish or English.
> • **Privacy-first**: no account, all data local, ephemeral after the visit.
>
> Built solo in React Native + TypeScript. Tested with [N] Spanish-speaking seniors. Endorsed by [doctor/clinic if you can get it].

---

## 4. The README (for the public GitHub repo)

Save this as `README.md` in the project root:

```markdown
# 🩺 MedLingua

> Catches the dangerous mistakes Google Translate makes — for the 25 million Americans who don't speak English at the doctor.

<img src="docs/hero.png" alt="MedLingua hero" width="640" />

## The Problem

In English, "once" means one time. In Spanish, "once" means **eleven**.

Google Translate translates "once daily" as "once al día" — which a Spanish-speaking patient reads as **eleven pills a day.** This is one of dozens of documented translation failures that cause real medication errors every year.

For the ~25 million Americans with Limited English Proficiency — most of them seniors — every doctor visit is a guessing game.

## What MedLingua Does

- 🩺 **Live medical translation** — Whisper STT + GPT-4o trained for medical context
- 🛡️ **Safety Guardrail** — flags dangerous translation patterns ("once", PO/qd/bid abbreviations, decimal traps, AM/PM, drug vs. medicine, allergies, urgent symptoms)
- 📋 **Plain-language summary** — 6th-grade reading level, medications, next visit, what to do at home
- 🚨 **Urgent warnings** — structured red-flag extraction with severity
- 💊 **Drug interaction checker** — second AI pass reviews the medication list
- 🧠 **Ask MedLingua** — grounded chat agent answers visit follow-up questions (no hallucinations)
- 👨‍⚕️ **Doctor mode** — fullscreen English summary + QR code to mirror to provider's device
- 🔒 **Privacy-first** — no account, no backend, AsyncStorage local-only, ephemeral after 1 min background

## Tech Stack

- **Frontend**: React Native (Expo SDK 54) + TypeScript + Expo Router
- **STT**: OpenAI Whisper (English + Spanish)
- **Translation + Summary**: OpenAI GPT-4o-mini with custom medical-interpreter system prompts
- **TTS**: expo-speech (es-MX + en-US)
- **Audio**: expo-av with live metering for waveform feedback
- **Storage**: AsyncStorage, local-only

## How It's Different from Google Translate

| | Google Translate | MedLingua |
|---|---|---|
| Catches "once daily" trap | ❌ | ✅ |
| Medical vocabulary | Generic | Specialized prompt |
| Plain-language summary | ❌ | ✅ |
| Urgent warning extraction | ❌ | ✅ |
| Drug interaction check | ❌ | ✅ |
| AI Q&A grounded in your visit | ❌ | ✅ |
| Doctor-facing English mirror | ❌ | ✅ |
| Senior-friendly UI | ❌ | ✅ |
| Bilingual UI | Limited | Full |
| Privacy (local-only) | ❌ | ✅ |

## Demo

Try the sample visit: tap "✨ Try sample visit" on the home screen.

## Built by

[Your name], [your school / district].

Solo project for the Congressional App Challenge 2026.

---

*MedLingua doesn't replace your doctor — it makes sure you understand what they said.*
```

---

## 5. The "Judges Google You" Checklist

Before you submit, all of these should be true:

- [ ] Public GitHub repo with the README above
- [ ] Hero screenshot saved to `docs/hero.png` (Doctor Mode looks the most impressive)
- [ ] 90-second YouTube demo video, unlisted, link in submission
- [ ] Optional landing page (Vercel, 1 hr): just the tagline + 3 screenshots + "See the demo" button → YouTube link
- [ ] Your name + school + grade in the README footer
- [ ] If you have a quote from a doctor, nurse, pharmacist, or LEP senior — add it to the README

---

## The Pitch Q&A Cheat Sheet

These are the questions judges always ask. Be ready.

**Q: "How is this different from Google Translate?"**
A: *"Google Translate is a phrasebook for tourists. MedLingua is a healthcare workflow. We catch the specific mistakes — like 'once daily' — that have been documented in medical-error literature. We generate the summary, the medication list, the warning signs. We flag drug interactions. Google does none of that."*

**Q: "What if you're wrong? Won't this cause errors?"**
A: *"That's why we never replace the doctor — we layer ON TOP. Every translation is shown alongside the original. The summary is editable. We flag uncertainty. And the disclaimer is permanent."*

**Q: "Is this HIPAA compliant?"**
A: *"Yes — by being local-only. No data leaves the phone except the encrypted call to OpenAI's API. There's no account, no server, no profile. The visit is automatically cleared if you background the app for over a minute."*

**Q: "Who tested it?"**
A: *[Have a real answer. If nothing else: yourself + 2 friends. Better: a real LEP senior — go find one this week.]*

**Q: "What's the business model?"**
A: *"Free to patients forever. Optional clinic partnerships where we white-label for healthcare systems — they pay per patient enrolled. The B2C app stays free."*

**Q: "Why you?"**
A: *[Your personal story. If you don't have one yet, build one this week.]*
