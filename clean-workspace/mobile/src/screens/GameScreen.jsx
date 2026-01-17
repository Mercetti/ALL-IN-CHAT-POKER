/**
 * Game Screen Component for React Native
 * Main poker game interface
 */

import React, { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';

const GameScreen = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const [gameState, setGameState] = useState('waiting');
  const [playerChips, setPlayerChips] = useState(1000);
  const [betAmount, setBetAmount] = useState(0);

  const handleBet = () => {
    if (betAmount > 0 && betAmount <= playerChips) {
      setPlayerChips(playerChips - betAmount);
      setGameState('betting');
    }
  };

  const handleFold = () => {
    setGameState('folded');
  };

  const handleCheck = () => {
    setGameState('checking');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.md,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    statusCard: {
      marginBottom: spacing.md,
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    chipsText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.success,
    },
    bettingCard: {
      marginBottom: spacing.md,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.md,
    },
    actionsCard: {
      marginBottom: spacing.md,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          All-In Chat Poker
        </Text>
      </View>
      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: styles.colors.text, marginBottom: spacing.md }}>
          Game Status: {gameState}
        </Text>
      </Card>
      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: styles.colors.text, marginBottom: spacing.md }}>
          Your Chips: {playerChips}
        </Text>
        <Input
          placeholder="Enter bet amount"
          value={betAmount.toString()}
          onChangeText={setBetAmount}
          keyboardType="numeric"
          style={{ marginBottom: spacing.md }}
        />
      </Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <Button title="Bet" onPress={handleBet} variant="primary" />
        <Button title="Check" onPress={handleCheck} variant="secondary" />
        <Button title="Fold" onPress={handleFold} variant="outline" />
      </View>
      <Card title="Game Actions" style={{ marginBottom: spacing.md }}>
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
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statusCard: {
    marginBottom: spacing.md,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  bettingCard: {
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  actionsCard: {
    marginBottom: spacing.md,
  },
});

export default GameScreen;
