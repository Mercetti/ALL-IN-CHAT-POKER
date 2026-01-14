// components/CodeSnippet.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CodeSnippetProps {
  snippet: string;
}

export default function CodeSnippet({ snippet }: CodeSnippetProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.code}>{snippet}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
});
