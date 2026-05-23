import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { askAboutVisit, type AskMessage } from '../services/claude';
import type { CallRecord } from '../types';
import { hapticLight } from '../utils/haptics';

type Lang = 'es' | 'en';

const L = {
  es: {
    title: 'Pregúntele a MedLingua',
    subtitle: 'Haga preguntas sobre su visita. La IA solo usa información del doctor.',
    placeholder: 'Escriba su pregunta...',
    send: 'Enviar',
    thinking: 'Pensando...',
    error: 'No pudimos responder. Intente otra vez.',
    suggestions: [
      '¿Qué hace la medicina?',
      '¿Cuándo es mi próxima visita?',
      '¿Qué pasa si me siento peor?',
    ],
    suggestionsLabel: 'Pruebe preguntar:',
    chip: '🧠 IA Médica',
  },
  en: {
    title: 'Ask MedLingua',
    subtitle: 'Ask questions about your visit. The AI only uses information from your doctor.',
    placeholder: 'Type your question...',
    send: 'Send',
    thinking: 'Thinking...',
    error: 'We could not answer. Try again.',
    suggestions: [
      'What does the medication do?',
      'When is my next visit?',
      'What if I feel worse?',
    ],
    suggestionsLabel: 'Try asking:',
    chip: '🧠 Medical AI',
  },
};

const C = {
  bg: '#F4F1EB',
  surface: '#FFFFFF',
  surfaceSunk: '#FAF7F1',
  line: '#E5DFD2',
  ink: '#1A1B1F',
  ink2: '#2E3138',
  inkSoft: '#555960',
  inkMute: '#8A8E96',
  primary: '#0F5BA8',
  primaryStrong: '#0A4682',
  primaryTint: '#DCEAF6',
  warm: '#B66A3E',
  warmTint: '#F3E2D2',
  alert: '#B5443A',
  alertTint: '#F4DDD8',
};

interface Props {
  call: CallRecord;
  lang: Lang;
}

export default function AskAI({ call, lang }: Props) {
  const t = L[lang];
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [streamingText, setStreamingText] = useState<string>('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    hapticLight();
    setInput('');
    setError(null);

    const userMessage: AskMessage = { role: 'user', content: trimmed };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setBusy(true);
    setStreamingText('');

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const answer = await askAboutVisit(
        call.transcript,
        call.summary,
        messages,
        trimmed,
        lang,
        (accumulated) => {
          setStreamingText(accumulated);
          // Smooth scroll while streaming
          scrollRef.current?.scrollToEnd({ animated: false });
        }
      );
      setMessages([...nextHistory, { role: 'assistant', content: answer }]);
      setStreamingText('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      setError(t.error);
      setStreamingText('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.iconWrap}>
            <Text style={s.icon}>🧠</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.titleRow}>
              <Text style={s.title}>{t.title}</Text>
              <View style={s.chip}>
                <Text style={s.chipText}>{t.chip}</Text>
              </View>
            </View>
            <Text style={s.subtitle}>{t.subtitle}</Text>
          </View>
        </View>
      </View>

      {messages.length === 0 ? (
        <View style={s.suggestions}>
          <Text style={s.suggestionsLabel}>{t.suggestionsLabel}</Text>
          {t.suggestions.map((q, i) => (
            <TouchableOpacity
              key={i}
              style={s.suggestionBtn}
              onPress={() => send(q)}
              activeOpacity={0.7}
            >
              <Text style={s.suggestionText}>{q}</Text>
              <Text style={s.suggestionArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={s.messageList}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} text={m.content} index={i} />
          ))}
          {busy && streamingText ? (
            <View style={[s.bubbleRow, s.bubbleRowLeft]}>
              <View style={[s.bubble, s.bubbleAssistant]}>
                <Text style={s.assistantText}>{streamingText}<Text style={s.cursor}>▍</Text></Text>
              </View>
            </View>
          ) : busy ? (
            <View style={[s.bubbleRow, s.bubbleRowLeft]}>
              <View style={[s.bubble, s.bubbleAssistant]}>
                <View style={s.thinkingRow}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={s.thinkingText}>{t.thinking}</Text>
                </View>
              </View>
            </View>
          ) : null}
          {error && (
            <View style={[s.bubble, s.bubbleError]}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.inputRow}
      >
        <TextInput
          style={s.input}
          placeholder={t.placeholder}
          placeholderTextColor={C.inkMute}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
          editable={!busy}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || busy) && s.sendBtnDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || busy}
          activeOpacity={0.8}
        >
          <Text style={s.sendText}>{busy ? '…' : '↑'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

function MessageBubble({ role, text, index }: { role: 'user' | 'assistant'; text: string; index: number }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        s.bubbleRow,
        role === 'user' ? s.bubbleRowRight : s.bubbleRowLeft,
        { opacity: fade, transform: [{ translateY: slide }] },
      ]}
    >
      <View style={[s.bubble, role === 'user' ? s.bubbleUser : s.bubbleAssistant]}>
        <Text style={role === 'user' ? s.userText : s.assistantText}>{text}</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
    shadowColor: '#1E2850',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    backgroundColor: C.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title: { fontSize: 19, fontWeight: '900', color: C.ink, letterSpacing: -0.2 },
  chip: {
    backgroundColor: C.warmTint,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    borderWidth: 1, borderColor: '#B66A3E33',
  },
  chipText: { fontSize: 10, fontWeight: '900', color: C.warm, letterSpacing: 0.4, textTransform: 'uppercase' },
  subtitle: { fontSize: 13, lineHeight: 18, color: C.inkSoft, fontWeight: '600', marginTop: 4 },

  suggestions: { padding: 14, gap: 8 },
  suggestionsLabel: {
    fontSize: 11, fontWeight: '900', color: C.inkMute,
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4, paddingHorizontal: 4,
  },
  suggestionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surfaceSunk,
    borderRadius: 14, borderWidth: 1, borderColor: C.line,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  suggestionText: { flex: 1, fontSize: 15, color: C.ink2, fontWeight: '700' },
  suggestionArrow: { fontSize: 20, color: C.inkMute, fontWeight: '700' },

  messageList: {
    maxHeight: 320,
    paddingHorizontal: 12,
  },
  bubbleRow: { flexDirection: 'row', marginVertical: 4 },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '88%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: C.primary,
    borderColor: C.primary,
    borderBottomRightRadius: 6,
  },
  bubbleAssistant: {
    backgroundColor: C.surfaceSunk,
    borderColor: C.line,
    borderBottomLeftRadius: 6,
  },
  bubbleError: {
    backgroundColor: C.alertTint,
    borderColor: '#F0A9A3',
  },
  userText: { fontSize: 15, color: '#fff', lineHeight: 21, fontWeight: '600' },
  assistantText: { fontSize: 15, color: C.ink, lineHeight: 21, fontWeight: '600' },
  cursor: { color: C.primary, fontWeight: '900', opacity: 0.85 },
  errorText: { fontSize: 14, color: C.alert, fontWeight: '700' },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thinkingText: { fontSize: 14, color: C.inkSoft, fontWeight: '700' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: C.line,
    backgroundColor: C.surfaceSunk,
  },
  input: {
    flex: 1, minHeight: 44,
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: C.ink, fontWeight: '600',
    borderWidth: 1, borderColor: C.line,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  sendBtnDisabled: { backgroundColor: '#B5B3AB', shadowOpacity: 0 },
  sendText: { fontSize: 20, color: '#fff', fontWeight: '900' },
});
