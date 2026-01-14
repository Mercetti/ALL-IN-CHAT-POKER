/**
 * Game Screen Component for React Native
 * Main poker game interface
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';

const GameScreen = () => {
  const theme = useTheme();
  const [gameState, setGameState] = useState('waiting');
  const [playerChips, setPlayerChips] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);

  const handleBet = () => {
    if (betAmount <= playerChips) {
      setPlayerChips(prev => prev - betAmount);
      setGameState('playing');
    }
  };

  const handleFold = () => {
    setGameState('waiting');
  };

  const handleCheck = () => {
    setGameState('playing');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎰 All-In Chat Poker</Text>
        <Text style={styles.subtitle}>Mobile Game</Text>
      </View>

      <Card title="Game Status" style={styles.statusCard}>
        <Text style={styles.statusText}>
          Status: {gameState}
        </Text>
        <Text style={styles.chipsText}>
          Chips: ${playerChips}
        </Text>
      </Card>

      <Card title="Betting" style={styles.bettingCard}>
        <Input
          label="Bet Amount"
          value={betAmount.toString()}
          onChangeText={setBetAmount}
          keyboardType="numeric"
        />
        <View style={styles.buttonRow}>
          <Button
            title="Bet"
            onPress={handleBet}
            variant="primary"
          />
          <Button
            title="Check"
            onPress={handleCheck}
            variant="secondary"
          />
          <Button
            title="Fold"
            onPress={handleFold}
            variant="danger"
          />
        </View>
      </Card>

      <Card title="Game Actions" style={styles.actionsCard}>
        <Button
          title="View Profile"
          variant="outline"
        />
        <Button
          title="Tournaments"
          variant="outline"
        />
        <Button
          title="Settings"
          variant="ghost"
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  statusCard: {
    marginBottom: theme.spacing.md,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  chipsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  bettingCard: {
    marginBottom: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  actionsCard: {
    marginBottom: theme.spacing.md,
  },
});

export default GameScreen;
