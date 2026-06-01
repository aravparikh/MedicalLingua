import * as ExpoSpeech from 'expo-speech';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNav from '../components/BottomNav';
import LanguagePill from '../components/LanguagePill';
import { useLanguage } from '../hooks/useLanguage';
import {
  getHapticsEnabled,
  getReadAloudDefault,
  getTTSRate,
  resetTutorial,
  setHapticsEnabled,
  setReadAloudDefault,
  setTTSRate,
} from '../services/preferences';
import { clearAllCalls, loadCalls } from '../services/storage';
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning, refreshHapticsPreference } from '../utils/haptics';

import { Theme as C, Shadows } from '../constants/theme';
type Lang = 'es' | 'en';

const L = {
  es: {
    home: 'Inicio',
    title: 'Ajustes',

    // Sections
    sectionAccount: 'Cuenta',
    sectionLanguage: 'Idioma',
    sectionVoice: 'Voz y audio',
    sectionPrivacy: 'Privacidad y datos',
    sectionHelp: 'Ayuda',
    sectionAbout: 'Acerca de',

    // Account
    signIn: 'Iniciar sesión',
    signInSub: 'Próximamente — sincronizar visitas entre dispositivos',
    guestMode: 'Modo invitado',
    guestModeSub: 'Sus datos están en este teléfono solamente',

    // Language
    languageLabel: 'Idioma de la app',
    spanish: 'Español',
    english: 'English',

    // Voice
    readAloud: 'Leer traducciones en voz alta',
    readAloudSub: 'Activar el altavoz por defecto en cada visita',
    speechRate: 'Velocidad de la voz',
    rateSlow: 'Lenta',
    rateNormal: 'Normal',
    rateFast: 'Rápida',
    testVoice: '🔊 Probar voz',
    testText: 'Hola, soy MedLingua. Estoy aquí para ayudarle a entender a su doctor.',

    // Haptics
    haptics: 'Vibración táctil',
    hapticsSub: 'Pequeñas vibraciones al tocar botones',

    // Privacy
    visitsStored: (n: number) => `${n} visita${n === 1 ? '' : 's'} guardada${n === 1 ? '' : 's'} en este dispositivo`,
    clearAll: 'Borrar todas las visitas',
    clearAllSub: 'Acción permanente',
    privacyPolicy: 'Política de privacidad',
    privacyPolicySub: 'Lo que nunca hacemos con sus datos',
    privacyDetails: `MedLingua se construyó alrededor de un principio simple: sus conversaciones médicas son suyas.\n\n• No se requiere cuenta\n• Sus visitas se guardan SOLO en este teléfono\n• Audio se procesa y borra inmediatamente — no se guarda\n• Solo enviamos texto a OpenAI para traducción (cifrado)\n• Nunca vendemos, compartimos ni miramos sus datos\n• Si cierra la app por más de 1 minuto durante una visita, borramos la conversación abierta automáticamente`,
    privacyClose: 'Cerrar',

    // Help
    rewatchTutorial: 'Ver tutorial de nuevo',
    rewatchTutorialSub: 'Cómo usar MedLingua en 4 pasos',
    contactSupport: 'Contactar soporte',
    contactSupportSub: 'support@medlingua.app',
    rateApp: '⭐ Calificar MedLingua',
    rateAppSub: 'Si le ayudó, una calificación nos ayuda a llegar a más personas',

    // About
    version: 'Versión',
    builtBy: 'Hecho con cuidado para los 25 millones de americanos con dominio limitado del inglés.',

    // Confirmations
    clearTitle: '¿Borrar todas las visitas?',
    clearBody: 'Se eliminarán todas sus visitas y resúmenes guardados. No se puede deshacer.',
    cancel: 'Cancelar',
    confirmClear: 'Borrar todo',
    cleared: '✓ Visitas borradas',
    tutorialReset: '✓ Tutorial reiniciado',
  },
  en: {
    home: 'Home',
    title: 'Settings',

    sectionAccount: 'Account',
    sectionLanguage: 'Language',
    sectionVoice: 'Voice & audio',
    sectionPrivacy: 'Privacy & data',
    sectionHelp: 'Help',
    sectionAbout: 'About',

    signIn: 'Sign in',
    signInSub: 'Coming soon — sync visits across devices',
    guestMode: 'Guest mode',
    guestModeSub: 'Your data stays on this phone only',

    languageLabel: 'App language',
    spanish: 'Español',
    english: 'English',

    readAloud: 'Read translations aloud',
    readAloudSub: 'Turn speaker on by default for every visit',
    speechRate: 'Voice speed',
    rateSlow: 'Slow',
    rateNormal: 'Normal',
    rateFast: 'Fast',
    testVoice: '🔊 Test voice',
    testText: 'Hello, I am MedLingua. I am here to help you understand your doctor.',

    haptics: 'Haptic feedback',
    hapticsSub: 'Small vibrations when you tap buttons',

    visitsStored: (n: number) => `${n} visit${n === 1 ? '' : 's'} stored on this device`,
    clearAll: 'Clear all visits',
    clearAllSub: 'Permanent — cannot be undone',
    privacyPolicy: 'Privacy policy',
    privacyPolicySub: 'What we never do with your data',
    privacyDetails: `MedLingua was built around one principle: your medical conversations belong to you.\n\n• No account required\n• Visits are saved ONLY on this phone\n• Audio is processed and discarded immediately — never stored\n• Only text is sent to OpenAI for translation (encrypted in transit)\n• We never sell, share, or read your data\n• If the app is closed for over 1 minute during a visit, we auto-clear the open conversation for safety`,
    privacyClose: 'Close',

    rewatchTutorial: 'Watch tutorial again',
    rewatchTutorialSub: 'How to use MedLingua in 4 steps',
    contactSupport: 'Contact support',
    contactSupportSub: 'support@medlingua.app',
    rateApp: '⭐ Rate MedLingua',
    rateAppSub: 'If it helped you, a rating helps us reach more people',

    version: 'Version',
    builtBy: 'Built with care for the 25 million Americans with limited English proficiency.',

    clearTitle: 'Clear all visits?',
    clearBody: 'All your saved visits and summaries will be erased permanently. This cannot be undone.',
    cancel: 'Cancel',
    confirmClear: 'Erase everything',
    cleared: '✓ Visits cleared',
    tutorialReset: '✓ Tutorial reset',
  },
};

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const router = useRouter();
  const { lang, toggle: toggleLanguage } = useLanguage();
  const t = L[lang];

  const [visitCount, setVisitCount] = useState(0);
  const [readAloud, setReadAloud] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [ttsRate, setTTSRateState] = useState(0.88);

  useEffect(() => {
    (async () => {
      const [calls, ra, hp, rate] = await Promise.all([
        loadCalls(),
        getReadAloudDefault(),
        getHapticsEnabled(),
        getTTSRate(),
      ]);
      setVisitCount(calls.length);
      setReadAloud(ra);
      setHaptics(hp);
      setTTSRateState(rate);
    })();
  }, []);

  async function toggleReadAloud(value: boolean) {
    hapticLight();
    setReadAloud(value);
    await setReadAloudDefault(value);
  }

  async function toggleHaptics(value: boolean) {
    setHaptics(value);
    await setHapticsEnabled(value);
    await refreshHapticsPreference();
    if (value) hapticSuccess();
  }

  async function pickRate(rate: number) {
    hapticLight();
    setTTSRateState(rate);
    await setTTSRate(rate);
  }

  function testVoice() {
    hapticLight();
    ExpoSpeech.stop();
    ExpoSpeech.speak(t.testText, {
      language: lang === 'es' ? 'es-MX' : 'en-US',
      rate: ttsRate,
    });
  }

  function confirmClearAll() {
    hapticWarning();
    Alert.alert(t.clearTitle, t.clearBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.confirmClear,
        style: 'destructive',
        onPress: async () => {
          await clearAllCalls();
          setVisitCount(0);
          hapticSuccess();
          Alert.alert(t.cleared);
        },
      },
    ]);
  }

  async function rewatchTutorial() {
    hapticMedium();
    await resetTutorial();
    router.push('/tutorial');
  }

  function showPrivacyPolicy() {
    hapticLight();
    Alert.alert(t.privacyPolicy, t.privacyDetails, [{ text: t.privacyClose }]);
  }

  function openSupport() {
    hapticLight();
    Linking.openURL('mailto:support@medlingua.app?subject=MedLingua%20Support');
  }

  function openRate() {
    hapticLight();
    // Placeholder — would be the actual App Store URL after publishing
    Alert.alert(
      lang === 'es' ? 'Próximamente en App Store' : 'Coming soon to the App Store',
      lang === 'es' ? 'Estamos preparando el lanzamiento. Gracias por su apoyo.' : 'We\'re preparing the launch. Thanks for your support.'
    );
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.topBar}>
          <View style={{ width: 44 }} />
          <Text style={s.titleBar}>{t.title}</Text>
          <LanguagePill lang={lang} onToggle={toggleLanguage} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* ACCOUNT */}
          <SectionLabel text={t.sectionAccount} />
          <Card>
            <Row
              icon="👤"
              title={t.guestMode}
              subtitle={t.guestModeSub}
              right={<View style={s.activeChip}><Text style={s.activeChipText}>● Active</Text></View>}
            />
            <Divider />
            <Row
              icon="🔐"
              title={t.signIn}
              subtitle={t.signInSub}
              right={<View style={s.soonChip}><Text style={s.soonChipText}>SOON</Text></View>}
              muted
            />
          </Card>

          {/* LANGUAGE */}
          <SectionLabel text={t.sectionLanguage} />
          <Card>
            <View style={s.langRow}>
              <Text style={s.langLabel}>{t.languageLabel}</Text>
              <View style={s.langPicker}>
                <TouchableOpacity
                  style={[s.langOption, lang === 'es' && s.langOptionActive]}
                  onPress={() => { if (lang !== 'es') toggleLanguage(); }}
                  activeOpacity={0.7}
                >
                  <Text style={[s.langOptionText, lang === 'es' && s.langOptionTextActive]}>🇪🇸 ES</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.langOption, lang === 'en' && s.langOptionActive]}
                  onPress={() => { if (lang !== 'en') toggleLanguage(); }}
                  activeOpacity={0.7}
                >
                  <Text style={[s.langOptionText, lang === 'en' && s.langOptionTextActive]}>🇺🇸 EN</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* VOICE */}
          <SectionLabel text={t.sectionVoice} />
          <Card>
            <View style={s.switchRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={s.switchTitle}>{t.readAloud}</Text>
                <Text style={s.switchSub}>{t.readAloudSub}</Text>
              </View>
              <Switch
                value={readAloud}
                onValueChange={toggleReadAloud}
                trackColor={{ false: C.line, true: C.primary }}
                thumbColor="#FFF"
              />
            </View>
            <Divider />
            <View style={s.rateBlock}>
              <Text style={s.switchTitle}>{t.speechRate}</Text>
              <View style={s.rateRow}>
                {[
                  { value: 0.72, label: t.rateSlow },
                  { value: 0.88, label: t.rateNormal },
                  { value: 1.05, label: t.rateFast },
                ].map(({ value, label }) => (
                  <TouchableOpacity
                    key={value}
                    style={[s.rateChip, ttsRate === value && s.rateChipActive]}
                    onPress={() => pickRate(value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.rateChipText, ttsRate === value && s.rateChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={s.testBtn} onPress={testVoice} activeOpacity={0.8}>
                <Text style={s.testBtnText}>{t.testVoice}</Text>
              </TouchableOpacity>
            </View>
            <Divider />
            <View style={s.switchRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={s.switchTitle}>{t.haptics}</Text>
                <Text style={s.switchSub}>{t.hapticsSub}</Text>
              </View>
              <Switch
                value={haptics}
                onValueChange={toggleHaptics}
                trackColor={{ false: C.line, true: C.primary }}
                thumbColor="#FFF"
              />
            </View>
          </Card>

          {/* PRIVACY */}
          <SectionLabel text={t.sectionPrivacy} />
          <Card>
            <View style={s.storageStat}>
              <View style={s.storageDot} />
              <Text style={s.storageText}>{t.visitsStored(visitCount)}</Text>
            </View>
            <Divider />
            <PressRow
              icon="🛡️"
              title={t.privacyPolicy}
              subtitle={t.privacyPolicySub}
              onPress={showPrivacyPolicy}
            />
            <Divider />
            <PressRow
              icon="🗑️"
              title={t.clearAll}
              subtitle={t.clearAllSub}
              onPress={confirmClearAll}
              destructive
            />
          </Card>

          {/* HELP */}
          <SectionLabel text={t.sectionHelp} />
          <Card>
            <PressRow
              icon="📚"
              title={t.rewatchTutorial}
              subtitle={t.rewatchTutorialSub}
              onPress={rewatchTutorial}
            />
            <Divider />
            <PressRow
              icon="✉️"
              title={t.contactSupport}
              subtitle={t.contactSupportSub}
              onPress={openSupport}
            />
            <Divider />
            <PressRow
              icon="⭐"
              title={t.rateApp}
              subtitle={t.rateAppSub}
              onPress={openRate}
            />
          </Card>

          {/* ABOUT */}
          <SectionLabel text={t.sectionAbout} />
          <Card>
            <View style={s.versionRow}>
              <View style={s.versionIcon}><Text style={{ fontSize: 22 }}>🩺</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.versionApp}>MedLingua</Text>
                <Text style={s.versionNumber}>{t.version} {APP_VERSION}</Text>
              </View>
            </View>
            <Text style={s.aboutText}>{t.builtBy}</Text>
          </Card>

          <View style={{ height: 8 }} />
        </ScrollView>
        <BottomNav active="settings" lang={lang} />
      </SafeAreaView>
    </View>
  );
}

// ── Helper components ──────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return <Text style={s.sectionLabel}>{text}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
}

function Divider() {
  return <View style={s.divider} />;
}

function Row({
  icon, title, subtitle, right, muted,
}: { icon: string; title: string; subtitle?: string; right?: React.ReactNode; muted?: boolean }) {
  return (
    <View style={s.row}>
      <View style={s.rowIcon}><Text style={s.rowIconText}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowTitle, muted && { color: C.inkMute }]}>{title}</Text>
        {subtitle ? <Text style={s.rowSub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function PressRow({
  icon, title, subtitle, onPress, destructive,
}: { icon: string; title: string; subtitle?: string; onPress: () => void; destructive?: boolean }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.rowIcon, destructive && s.rowIconDestructive]}>
        <Text style={s.rowIconText}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowTitle, destructive && { color: C.alert }]}>{title}</Text>
        {subtitle ? <Text style={s.rowSub}>{subtitle}</Text> : null}
      </View>
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 6, paddingBottom: 8, gap: 10,
  },
  backBtn: {
    minHeight: 40, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1, borderColor: C.line,
    backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 14, color: C.primary, fontWeight: '900' },
  titleBar: { flex: 1, fontSize: 20, fontWeight: '900', color: C.ink, textAlign: 'center', letterSpacing: -0.3 },

  scroll: { paddingHorizontal: 18, paddingBottom: 110 },

  sectionLabel: {
    fontSize: 12, fontWeight: '900', color: C.inkMute,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginTop: 22, marginBottom: 10, marginLeft: 4,
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 18, borderWidth: 1, borderColor: C.line,
    overflow: 'hidden',
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  divider: { height: 1, backgroundColor: C.lineSoft, marginLeft: 64 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    minHeight: 64,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: C.surfaceSunk,
    borderWidth: 1, borderColor: C.lineSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  rowIconDestructive: {
    backgroundColor: C.alertTint, borderColor: '#E2887C55',
  },
  rowIconText: { fontSize: 18 },
  rowTitle: { fontSize: 15, fontWeight: '800', color: C.ink, letterSpacing: -0.1 },
  rowSub: { fontSize: 13, color: C.inkSoft, marginTop: 2, fontWeight: '600' },
  chevron: { fontSize: 22, color: C.inkFaint, fontWeight: '800' },

  activeChip: {
    backgroundColor: C.listenTint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1, borderColor: '#0D948833',
  },
  activeChipText: { fontSize: 11, fontWeight: '900', color: C.listen, letterSpacing: 0.4 },
  soonChip: {
    backgroundColor: C.lineSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  soonChipText: { fontSize: 10, fontWeight: '900', color: C.inkMute, letterSpacing: 0.6 },

  langRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  langLabel: { fontSize: 15, fontWeight: '800', color: C.ink },
  langPicker: {
    flexDirection: 'row', gap: 4,
    backgroundColor: C.surfaceSunk, borderRadius: 12, padding: 3,
    borderWidth: 1, borderColor: C.lineSoft,
  },
  langOption: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  langOptionActive: {
    backgroundColor: C.primary,
    shadowColor: C.primary, shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  langOptionText: { fontSize: 13, fontWeight: '900', color: C.inkSoft, letterSpacing: 0.2 },
  langOptionTextActive: { color: '#FFF' },

  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, minHeight: 64,
  },
  switchTitle: { fontSize: 15, fontWeight: '800', color: C.ink, letterSpacing: -0.1 },
  switchSub: { fontSize: 13, color: C.inkSoft, marginTop: 2, fontWeight: '600' },

  rateBlock: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  rateRow: { flexDirection: 'row', gap: 8 },
  rateChip: {
    flex: 1, minHeight: 40, borderRadius: 10,
    backgroundColor: C.surfaceSunk,
    borderWidth: 1, borderColor: C.lineSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  rateChipActive: {
    backgroundColor: C.primaryTint,
    borderColor: C.primary,
  },
  rateChipText: { fontSize: 13, fontWeight: '900', color: C.inkSoft },
  rateChipTextActive: { color: C.primaryStrong },
  testBtn: {
    minHeight: 44, borderRadius: 12,
    backgroundColor: C.warmTint,
    borderWidth: 1, borderColor: '#C2410C33',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  testBtnText: { fontSize: 14, fontWeight: '900', color: C.warm, letterSpacing: 0.1 },

  storageStat: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14, minHeight: 56,
  },
  storageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.listen },
  storageText: { fontSize: 14, color: C.ink2, fontWeight: '700', flex: 1 },

  versionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  versionIcon: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: C.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  versionApp: { fontSize: 17, fontWeight: '900', color: C.ink, letterSpacing: -0.2 },
  versionNumber: { fontSize: 12, color: C.inkMute, fontWeight: '700', marginTop: 1, letterSpacing: 0.2 },
  aboutText: {
    fontSize: 13, lineHeight: 19, color: C.inkSoft, fontWeight: '600',
    paddingHorizontal: 16, paddingBottom: 16,
  },
});
