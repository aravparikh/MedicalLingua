/**
 * Card — themed surface with optional press behavior.
 */
import React from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { hapticLight } from '../../utils/haptics';
import { useTheme } from './Screen';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function Card({ children, onPress, style }: CardProps) {
  const { recipes } = useTheme();

  if (onPress) {
    return (
      <TouchableOpacity
        style={[recipes.card as ViewStyle, style]}
        onPress={() => {
          hapticLight();
          onPress();
        }}
        activeOpacity={0.88}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[recipes.card as ViewStyle, style]}>{children}</View>;
}
