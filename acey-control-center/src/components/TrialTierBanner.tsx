import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface UserAccess {
  tier: string;
  trials?: Array<{
    skillName: string;
    expiresInHours: number;
  }>;
  trialRemaining?: number;
}

interface TrialTierBannerProps {
  userAccess: UserAccess;
  onUpgrade: () => void;
}

export default function TrialTierBanner({ 
  userAccess, 
  onUpgrade
}: TrialTierBannerProps) {
  const trialSkills = userAccess?.trials || [];
  const tier = userAccess?.tier || 'Free';
  
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'free': return '#34C759';
      case 'pro': return '#007AFF';
      case 'creator+': return '#AF52DE';
      case 'enterprise': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getUrgencyColor = (hours: number) => {
    if (hours <= 6) return '#FF3B30';
    if (hours <= 24) return '#FF9500';
    return '#007AFF';
  };

  const hasActiveTrials = trialSkills.length > 0;
  const hasExpiringTrials = trialSkills.some(trial => trial.expiresInHours <= 24);
  const canUpgrade = tier !== 'Enterprise';

  return (
    <View style={styles.container}>
      {/* Tier Information */}
      <View style={styles.tierSection}>
        <View style={styles.tierHeader}>
          <Text style={styles.tierLabel}>Current Tier</Text>
          <View style={[styles.tierBadge, { backgroundColor: getTierColor(tier) }]}>
            <Text style={styles.tierText}>{tier}</Text>
          </View>
        </View>
        
        {canUpgrade && (
          <Button
            title="Upgrade Tier"
            onPress={onUpgrade}
            color="#007AFF"
          />
        )}
      </View>

      {/* Trial Information */}
      {hasActiveTrials && (
        <View style={styles.trialSection}>
          <Text style={styles.trialTitle}>Active Trials</Text>
          {trialSkills.map((trial, index) => (
            <View key={index} style={styles.trialItem}>
              <View style={styles.trialHeader}>
                <Text style={styles.trialSkillName}>{trial.skillName}</Text>
                <View style={[
                  styles.trialBadge,
                  { backgroundColor: getUrgencyColor(trial.expiresInHours) }
                ]}>
                  <Text style={styles.trialBadgeText}>
                    {trial.expiresInHours <= 6 ? 'EXPIRING SOON' : 
                     trial.expiresInHours <= 24 ? 'EXPIRES TODAY' : 'ACTIVE'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.trialDetails}>
                <Text style={[
                  styles.trialTime,
                  { color: getUrgencyColor(trial.expiresInHours) }
                ]}>
                  {trial.expiresInHours} hours remaining
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Trial Remaining Days */}
      {userAccess?.trialRemaining && userAccess.trialRemaining > 0 && (
        <View style={styles.trialRemainingSection}>
          <Text style={styles.trialRemainingText}>
            {userAccess.trialRemaining} trial days remaining
          </Text>
        </View>
      )}

      {/* Urgency Banner */}
      {hasExpiringTrials && (
        <View style={styles.urgencyBanner}>
          <Text style={styles.urgencyIcon}>⚠️</Text>
          <Text style={styles.urgencyText}>
            Some trials expire soon! Upgrade to keep using your skills.
          </Text>
        </View>
      )}

      {/* Benefits */}
      {canUpgrade && (
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Upgrade Benefits:</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefit}>• Unlock all premium skills</Text>
            <Text style={styles.benefit}>• Unlimited usage</Text>
            <Text style={styles.benefit}>• Priority support</Text>
            <Text style={styles.benefit}>• Advanced analytics</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  tierSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginRight: 12,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tierText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  trialSection: {
    marginBottom: 16,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 12,
  },
  trialItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  trialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trialSkillName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  trialBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trialBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  trialDetails: {
    alignItems: 'flex-start',
  },
  trialTime: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  trialRemainingSection: {
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  trialRemainingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  urgencyBanner: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  urgencyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  urgencyText: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
  benefitsSection: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  benefitsList: {
    marginLeft: 8,
  },
  benefit: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
});