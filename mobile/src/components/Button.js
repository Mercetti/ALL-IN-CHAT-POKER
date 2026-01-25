/**
 * Button Component for React Native
 * Consistent with web app design system
 */

import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  testID,
  accessibilityLabel,
}) => {
  const { colors, spacing, borderRadius, typography } = useTheme();

  const baseStyle = {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 44,
  };

  const variants = {
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.secondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    danger: {
      backgroundColor: colors.error,
    },
  };

  const sizes = {
    small: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minWidth: 80,
    },
    large: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      minWidth: 160,
    },
  };

  const getButtonStyle = () => {
    const buttonStyle = [
      baseStyle,
      variants[variant],
      sizes[size],
      style,
    ];

    if (disabled) {
      buttonStyle.push({ opacity: 0.5 });
    }

    return buttonStyle;
  };

  const getTextStyle = () => {
    return [
      {
        color: variant === 'outline' ? colors.primary : colors.surface,
        fontSize: typography.md,
        fontWeight: '600',
        textAlign: 'center',
      },
      disabled && { color: colors.textSecondary },
    ];
  };

  return React.createElement(
    TouchableOpacity,
    {
      onPress: onPress,
      style: getButtonStyle(),
      disabled: disabled,
      activeOpacity: 0.8,
      testID: testID || 'button',
      accessible: true,
      accessibilityLabel: accessibilityLabel || title,
      accessibilityRole: 'button',
    },
    React.createElement(
      View,
      { style: { flexDirection: 'row', alignItems: 'center' } },
      icon && React.createElement(View, { style: { marginRight: spacing.sm } }, icon),
      React.createElement(
        Text,
        { style: getTextStyle() },
        loading ? 'Loading...' : title
      )
    )
  );
};

export default Button;
