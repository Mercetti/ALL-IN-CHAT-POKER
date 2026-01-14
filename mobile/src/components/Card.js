/**
 * Card Component for React Native
 * Consistent with web app design system
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const Card = ({ 
  children, 
  title, 
  subtitle, 
  variant = 'default', 
  style = {} 
}) => {
  const theme = useTheme();
  
  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginVertical: theme.spacing.sm,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    };

    const variants = {
      default: baseStyle,
      interactive: {
        ...baseStyle,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      },
    };

    return [
      variants[variant],
      style
    ];
  };

  return (
    <View style={getCardStyle()}>
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
});

export default Card;
