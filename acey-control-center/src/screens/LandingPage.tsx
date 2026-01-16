import React from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type LandingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

export default function LandingPage() {
  const navigation = useNavigation<LandingNavigationProp>();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Welcome to Acey</Text>
        <Text style={styles.subtitle}>Your AI-Powered Creative Assistant</Text>
        <Text style={styles.description}>
          Unlock powerful skills for code, audio, graphics, and content review. 
          Built for creators, developers, and teams.
        </Text>
      </View>

      <View style={styles.features}>
        <Text style={styles.sectionTitle}>Available Skills</Text>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>🔧 Code Helper Pro</Text>
          <Text style={styles.featureDescription}>Advanced code generation and review</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>🎵 Audio Maestro</Text>
          <Text style={styles.featureDescription}>Professional audio production tools</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>🎨 Graphics Wizard</Text>
          <Text style={styles.featureDescription}>AI-powered graphics creation</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>📊 Stream Ops Pro</Text>
          <Text style={styles.featureDescription}>Stream management and analytics</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>🔗 Link Review</Text>
          <Text style={styles.featureDescription}>Content safety and review tools</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>🧪 Overlay Testing Pro</Text>
          <Text style={styles.featureDescription}>Automated Playwright test generation and maintenance</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Browse Skills"
          onPress={() => navigation.navigate('SkillStore', { userToken: 'demo-token', userRole: 'user' })}
          color="#007AFF"
        />
        
        <Button
          title="Try Demo"
          onPress={() => navigation.navigate('DemoFlow')}
          color="#34C759"
        />
        
        <Button
          title="View Metrics"
          onPress={() => navigation.navigate('MetricsDashboard')}
          color="#FF9500"
        />
        
        <Button
          title="Learning Dashboard"
          onPress={() => navigation.navigate('LearningDashboard')}
          color="#AF52DE"
        />
        
        <Button
          title="Acey Lab"
          onPress={() => navigation.navigate('AceyLab')}
          color="#FF3B30"
        />
        
        <Button
          title="🧪 Overlay Testing"
          onPress={() => navigation.navigate('OverlayTesting')}
          color="#5856D6"
        />
        
        <Button
          title="🔐 Security"
          onPress={() => navigation.navigate('Security')}
          color="#007AFF"
        />
        
        <Button
          title="📚 Skill Library"
          onPress={() => navigation.navigate('SkillLibrary', { userRole: 'user', userTier: 'Free', onSkillExecute: (skillName) => console.log('Execute skill:', skillName) })}
          color="#3B82F6"
        />
        
        <Button
          title="👥 Partner Dashboard"
          onPress={() => navigation.navigate('PartnerDashboard', { partnerId: 'demo-partner', onRequestPayout: (amount) => console.log('Request payout:', amount), onViewDispute: (id) => console.log('View dispute:', id) })}
          color="#10B981"
        />
        
        <Button
          title="📊 Investor Dashboard"
          onPress={() => navigation.navigate('InvestorDashboard', { investorId: 'demo-investor', onDownloadReport: (type) => console.log('Download report:', type), onRequestMeeting: () => console.log('Request meeting') })}
          color="#F59E0B"
        />
        
        <Button
          title="Settings"
          onPress={() => navigation.navigate('Settings')}
          color="#8E8E93"
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
        <Text style={styles.footerText}>© 2026 Acey Platform</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  hero: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  featureCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    padding: 20,
    gap: 15,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 5,
  },
});
