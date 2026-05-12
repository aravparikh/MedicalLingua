import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CallRecord } from '../types';

const STORAGE_KEY = 'medlingua_calls';

export async function loadCalls(): Promise<CallRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as CallRecord[];
}

export async function saveCall(call: CallRecord): Promise<void> {
  const existing = await loadCalls();
  const updated = [call, ...existing.filter((c) => c.id !== call.id)];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function updateCall(call: CallRecord): Promise<void> {
  const existing = await loadCalls();
  const updated = existing.map((c) => (c.id === call.id ? call : c));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function deleteCall(id: string): Promise<void> {
  const existing = await loadCalls();
  const updated = existing.filter((c) => c.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
