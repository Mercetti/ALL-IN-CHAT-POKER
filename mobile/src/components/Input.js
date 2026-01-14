/**
 * Input Component for React Native
 * Consistent with web app design system
 */

import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const Input = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  error, 
  secureTextEntry = false, 
  keyboardType = 'default', 
  style = {} 
}) => {
  const theme = useTheme();
  
  const baseStyle = {
    borderWidth: 1,
    borderColor: error ? theme.colors.error : theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  };

  const getInputStyle = () => {
    return [baseStyle, style];
  };

  return React.createElement(
    View,
    { style: { marginBottom: theme.spacing.sm } },
    label && React.createElement(
      Text,
      {
        style: {
          fontSize: 14,
          fontWeight: '500',
          color: '#ffffff',
          marginBottom: 8,
        }
      },
      label
    ),
    React.createElement(
      TextInput,
      {
        placeholder: placeholder,
        value: value,
        onChangeText: onChangeText,
        secureTextEntry: secureTextEntry,
        keyboardType: keyboardType,
        style: getInputStyle(),
        placeholderTextColor: theme.colors.textSecondary,
        autoCapitalize: "none",
        autoCorrect: false,
      }
    ),
    error && React.createElement(
      Text,
      {
        style: {
          fontSize: 12,
          color: '#ef4444',
          marginTop: 4,
        }
      },
      error
    )
  );
};

export default Input;
