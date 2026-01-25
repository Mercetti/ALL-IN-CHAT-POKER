/**
 * Game Screen Component for React Native
 * Main poker game interface
 */

import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';

const GameScreen = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const [gameState, setGameState] = useState('waiting');
  const [playerChips, setPlayerChips] = useState(1000);
  const [betAmount, setBetAmount] = useState(0);

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
    actionsCard: {
      marginTop: spacing.lg,
    },
  });

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
    setGameState('checked');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg }}>
        <Text style={{ color: colors.text, fontSize: 24, marginBottom: spacing.lg }}>
          All-In Chat Poker
        </Text>
      </View>
      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: colors.text, marginBottom: spacing.md }}>
          Game Status: {gameState}
        </Text>
      </Card>
      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: colors.text, marginBottom: spacing.md }}>
          Your Chips: ${playerChips}
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

export default GameScreen;
