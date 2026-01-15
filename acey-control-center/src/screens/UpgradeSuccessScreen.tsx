import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface UpgradeConfirmationParams {
  successData: {
    type: string;
    price: number;
    features: string[];
  };
}

const UpgradeSuccessScreen: React.FC = () => {
  const navigation = useNavigation();
  const successData = {
    type: 'tier',
    price: 29.99,
    features: [
      'Unlimited AI generations',
      'Priority processing',
      'Advanced analytics',
      'Custom skill creation',
      'Premium support'
    ]
  };

  const handleContinue = () => {
    navigation.navigate('Dashboard' as never);
  };

  const handleViewFeatures = () => {
    navigation.navigate('TierOverview' as never);
  };

  const handleExploreSkills = () => {
    navigation.navigate('SkillStore' as never);
  };

  const renderPricingInfo = () => {
    return (
      <View style={styles.pricingInfo}>
        <Text style={styles.pricingText}>
          {successData.price === 0 ? 'FREE' : `$${successData.price}/month`}
        </Text>
        <Text style={styles.pricingDescription}>
          {successData.type === 'tier' ? 'Billed monthly' : 'Billed monthly'}
        </Text>
      </View>
    );
  };

  const renderFeatures = () => {
    if (!successData?.features || successData.features.length === 0) return null;

    return (
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>What's Included:</Text>
        {successData.features.slice(0, 4).map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.featureText}>✓ {feature}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎉 Upgrade Successful!</Text>
        <Text style={styles.subtitle}>
          Welcome to your new {successData.type === 'tier' ? 'premium tier' : 'plan'}!
        </Text>
      </View>

      <View style={styles.content}>
        {renderPricingInfo()}
        {renderFeatures()}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue to Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={handleViewFeatures}
        >
          <Text style={styles.buttonText}>View Features</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.tertiaryButton]}
          onPress={handleExploreSkills}
        >
          <Text style={styles.buttonText}>Explore Skills</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    marginBottom: 30,
  },
  pricingInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pricingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  pricingDescription: {
    fontSize: 14,
    color: '#666',
  },
  featuresContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  actions: {
    gap: 12,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  tertiaryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default UpgradeSuccessScreen;
