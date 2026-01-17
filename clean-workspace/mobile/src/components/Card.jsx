/**
 * Card Component for React Native
 * Consistent with web app design system
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const Card = ({ children, variant = 'default', size = 'medium', suit, rank, faceDown = false, selected = false, disabled = false, style }) => {
  const { colors, spacing, borderRadius } = useTheme();

  const baseStyle = {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  };

  const variants = {
    default: baseStyle,
    outlined: {
      ...baseStyle,
      borderWidth: 1,
      borderColor: colors.border,
    },
    elevated: {
      ...baseStyle,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
  };

  const sizes = {
    small: {
      padding: spacing.sm,
      minHeight: 60,
    },
    large: {
      padding: spacing.lg,
      minHeight: 120,
    },
  };

  const getCardStyle = () => {
    const cardStyle = [
      variants[variant],
      sizes[size],
      style,
    ];

    if (selected) {
      cardStyle.push({ borderColor: colors.primary, borderWidth: 2 });
    }

    if (disabled) {
      cardStyle.push({ opacity: 0.5 });
    }

    return cardStyle;
  };

  const renderCardContent = () => {
    if (suit && rank) {
      return React.createElement(
        View,
        { style: { alignItems: 'center', justifyContent: 'center' } },
        React.createElement(
          Text,
          {
            style: {
              fontSize: 48,
              fontWeight: 'bold',
              color: faceDown ? colors.textSecondary : colors.text,
              marginBottom: spacing.sm,
            }
          },
          faceDown ? '?' : rank
        ),
        suit && React.createElement(
          Text,
          {
            style: {
              fontSize: 24,
              fontWeight: 'bold',
              color: colors.primary,
              position: 'absolute',
              bottom: spacing.sm,
              right: spacing.sm,
            }
          },
          suit
        )
      );
    }

    return children;
  };

  return React.createElement(
    View,
    { style: getCardStyle() },
    renderCardContent()
  );
};

export default Card;
