/**
 * Button — primary / secondary / destructive variants with haptic
 * press feedback and optional leading icon. 56pt minimum target.
 */
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Type } from '../../constants/theme';
import { hapticLight } from '../../utils/haptics';
import { useTheme } from './Screen';

type Variant = 'primary' | 'secondary' | 'destructive';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { c, recipes } = useTheme();

  const base: ViewStyle =
    variant === 'secondary'
      ? recipes.buttonSecondary
      : variant === 'destructive'
        ? { ...recipes.buttonPrimary, backgroundColor: c.alert, shadowColor: c.alert }
        : recipes.buttonPrimary;

  const textColor =
    variant === 'secondary' ? c.ink : c.onPrimary;

  return (
    <TouchableOpacity
      style={[base as ViewStyle, disabled && styles.disabled, style]}
      onPress={() => {
        hapticLight();
        onPress();
      }}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={textColor} />}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: { ...Type.bodyLarge, fontWeight: '800' },
  disabled: { opacity: 0.45 },
});
