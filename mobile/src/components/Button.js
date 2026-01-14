/**
 * Button Component for React Native
 * Consistent with web app design system
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  loading = false, 
  icon = null,
  style = {} 
}) => {
  const theme = useTheme();
  
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 44,
      minHeight: 44,
    };

    const variants = {
      primary: {
        backgroundColor: theme.colors.primary,
        ...baseStyle,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
        ...baseStyle,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
        ...baseStyle,
      },
      ghost: {
        backgroundColor: 'transparent',
        ...baseStyle,
      },
      danger: {
        backgroundColor: theme.colors.error,
        ...baseStyle,
      },
      success: {
        backgroundColor: theme.colors.success,
        ...baseStyle,
      },
    };

    const sizes = {
      small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        fontSize: 14,
        minHeight: 32,
      },
      medium: {
        ...baseStyle,
      },
      large: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        fontSize: 18,
        minHeight: 56,
      },
    };

    const buttonStyle = [
      variants[variant],
      sizes[size],
      disabled && { opacity: 0.6 },
      style
    ];

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={buttonStyle}
        activeOpacity={0.8}
      accessibilityRole="button"
        accessibilityLabel={title}
      >
        <View style={styles.container}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={styles.text}>{title}</Text>
        </View>
      </TouchableOpacity>
    );
  };
}
