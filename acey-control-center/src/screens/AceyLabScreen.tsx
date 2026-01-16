import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SkillCard from '../components/SkillCard';
import TrialTierBanner from '../components/TrialTierBanner';
import OwnerNotificationPanel from '../components/OwnerNotificationPanel';
import { getUserAccess, unlockSkill } from '../services/monetizationService';
import { AceyMobileOrchestrator } from '../services/aceyMobileOrchestrator';
import { notifySkillUnlock, notifyTrialExpiration, notifyApprovedOutput } from '../services/aceyMobileNotifier';

// Types for device sync
interface DeviceState {
  deviceId: string;
  deviceName: string;
  lastSync: string;
  skills: Array<{
    name: string;
    version: string;
    isActive: boolean;
    trustLevel: number;
  }>;
  datasets: Array<{
    name: string;
    size: number;
    lastUpdated: string;
    quality: number;
  }>;
  trustLevel: number;
  isAuthorized: boolean;
}

interface SyncResult {
  success: boolean;
  deviceId: string;
  timestamp: string;
  syncedItems: number;
  errors?: string[];
  warnings?: string[];
}

export default function AceyLabScreen({ userToken, ownerToken, username, userRole }: any) {
  const [userAccess, setUserAccess] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [devices, setDevices] = useState<DeviceState[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'skills' | 'devices' | 'sync'>('skills');

  const orchestrator = new AceyMobileOrchestrator(ownerToken);

  const fetchData = async () => {
    const access = await getUserAccess(userToken);
    setUserAccess(access);
    if (orchestrator.userCanAccess(userRole)) {
      setNotifications(await orchestrator.getRecentEvents());
    }
    // Load devices (mock data for now)
    loadDevices();
  };

  const loadDevices = () => {
    // Mock device data - in production, this would come from DeviceSync
    const mockDevices: DeviceState[] = [
      {
        deviceId: 'desktop-main',
        deviceName: 'desktop-windows',
        lastSync: new Date().toISOString(),
        skills: [
          { name: 'CodeHelper', version: '1.0.0', isActive: true, trustLevel: 3 },
          { name: 'SecurityObserver', version: '1.0.0', isActive: true, trustLevel: 3 },
          { name: 'DataAnalyzer', version: '1.0.0', isActive: false, trustLevel: 2 }
        ],
        datasets: [
          { name: 'code_training', size: 1024000, lastUpdated: new Date().toISOString(), quality: 0.85 },
          { name: 'security_logs', size: 512000, lastUpdated: new Date().toISOString(), quality: 0.92 }
        ],
        trustLevel: 3,
        isAuthorized: true
      },
      {
        deviceId: 'mobile-tablet',
        deviceName: 'tablet-android',
        lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        skills: [
          { name: 'CodeHelper', version: '1.0.0', isActive: true, trustLevel: 2 },
          { name: 'AudioMaestro', version: '1.0.0', isActive: true, trustLevel: 2 }
        ],
        datasets: [
          { name: 'code_training', size: 1024000, lastUpdated: new Date().toISOString(), quality: 0.85 }
        ],
        trustLevel: 2,
        isAuthorized: true
      },
      {
        deviceId: 'laptop-dev',
        deviceName: 'laptop-macos',
        lastSync: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        skills: [
          { name: 'GraphicsWizard', version: '1.0.0', isActive: true, trustLevel: 3 },
          { name: 'LinkReview', version: '1.0.0', isActive: false, trustLevel: 1 }
        ],
        datasets: [
          { name: 'graphics_training', size: 2048000, lastUpdated: new Date().toISOString(), quality: 0.78 }
        ],
        trustLevel: 1,
        isAuthorized: false
      }
    ];
    setDevices(mockDevices);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUnlock = async (skillId: string) => {
    await unlockSkill(userToken, skillId);
    orchestrator.handleSkillUnlock(username, userToken, skillId);
    notifySkillUnlock(skillId);
    fetchData();
  };

  const syncDevice = async (deviceId: string) => {
    setSyncing(deviceId);
    
    try {
      // Mock sync operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update device last sync time
      setDevices(prev => prev.map(device => 
        device.deviceId === deviceId 
          ? { ...device, lastSync: new Date().toISOString() }
          : device
      ));
      
      Alert.alert('Sync Complete', `Device ${deviceId} synchronized successfully`);
    } catch (error) {
      Alert.alert('Sync Failed', `Failed to sync device ${deviceId}: ${error}`);
    } finally {
      setSyncing(null);
    }
  };

  const authorizeDevice = (deviceId: string) => {
    Alert.alert(
      'Authorize Device',
      `Authorize device ${deviceId} for sync operations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Authorize',
          onPress: () => {
            setDevices(prev => prev.map(device => 
              device.deviceId === deviceId 
                ? { ...device, isAuthorized: true, trustLevel: 2 }
                : device
            ));
            Alert.alert('Authorized', `Device ${deviceId} has been authorized`);
          }
        }
      ]
    );
  };

  const revokeDevice = (deviceId: string) => {
    Alert.alert(
      'Revoke Device',
      `Revoke access for device ${deviceId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          onPress: () => {
            setDevices(prev => prev.map(device => 
              device.deviceId === deviceId 
                ? { ...device, isAuthorized: false, trustLevel: 1 }
                : device
            ));
            Alert.alert('Revoked', `Access for device ${deviceId} has been revoked`);
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    fetchData();
    setRefreshing(false);
  };

  const renderDeviceItem = ({ item }: { item: DeviceState }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.deviceName}</Text>
          <Text style={styles.deviceId}>{item.deviceId}</Text>
        </View>
        <View style={[styles.deviceStatus, { 
          backgroundColor: item.isAuthorized ? '#4CAF50' : '#F44336' 
        }]}>
          <Text style={styles.statusText}>
            {item.isAuthorized ? '✅ Authorized' : '❌ Unauthorized'}
          </Text>
        </View>
      </View>
      
      <View style={styles.deviceDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Trust Level:</Text>
          <Text style={styles.detailValue}>{item.trustLevel}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Skills:</Text>
          <Text style={styles.detailValue}>{item.skills.length}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Datasets:</Text>
          <Text style={styles.detailValue}>{item.datasets.length}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Sync:</Text>
          <Text style={styles.detailValue}>{new Date(item.lastSync).toLocaleString()}</Text>
        </View>
      </View>
      
      <View style={styles.deviceActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.syncButton]}
          onPress={() => syncDevice(item.deviceId)}
          disabled={syncing === item.deviceId}
        >
          {syncing === item.deviceId ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionButtonText}>Sync</Text>
          )}
        </TouchableOpacity>
        
        {item.isAuthorized ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.revokeButton]}
            onPress={() => revokeDevice(item.deviceId)}
          >
            <Text style={styles.actionButtonText}>Revoke</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.authorizeButton]}
            onPress={() => authorizeDevice(item.deviceId)}
          >
            <Text style={styles.actionButtonText}>Authorize</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'skills' && styles.activeTab]}
        onPress={() => setActiveTab('skills')}
      >
        <Text style={[styles.tabText, activeTab === 'skills' && styles.activeTabText]}>
          Skills
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'devices' && styles.activeTab]}
        onPress={() => setActiveTab('devices')}
      >
        <Text style={[styles.tabText, activeTab === 'devices' && styles.activeTabText]}>
          Devices ({devices.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'sync' && styles.activeTab]}
        onPress={() => setActiveTab('sync')}
      >
        <Text style={[styles.tabText, activeTab === 'sync' && styles.activeTabText]}>
          Sync
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Mock skills data
  const skillsList = [
    {
      id: 'code_helper',
      name: 'Code Helper',
      icon: 'https://example.com/icon-code.png',
      type: 'code',
      tier: 'Free',
      description: 'AI-powered code completion and bug detection',
      features: ['Code completion', 'Bug detection', 'Syntax highlighting'],
      preview: 'function hello() { console.log("Hello World"); }'
    },
    {
      id: 'audio_maestro',
      name: 'Audio Maestro',
      icon: 'https://example.com/icon-audio.png',
      type: 'audio',
      tier: 'Pro',
      description: 'Generate custom audio tracks and music',
      features: ['Custom music generation', 'Voice synthesis', 'Audio effects'],
      preview: 'https://example.com/preview-audio.mp3'
    },
    {
      id: 'graphics_wizard',
      name: 'Graphics Wizard',
      icon: 'https://example.com/icon-graphics.png',
      type: 'graphics',
      tier: 'Creator+',
      description: 'AI-powered image generation and editing',
      features: ['Image generation', 'Style transfer', 'Brand assets'],
      preview: 'https://example.com/preview-image.jpg'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Acey Lab</Text>
        <Text style={styles.headerSubtitle}>Cross-Device Orchestration</Text>
      </View>

      {renderTabs()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'skills' && (
          <>
            <TrialTierBanner userAccess={userAccess} onUpgrade={() => console.log('Upgrade pressed')} />
            {skillsList.map(skill => (
              <SkillCard key={skill.id} skill={skill} userAccess={userAccess} onUnlock={handleUnlock} />
            ))}
            {orchestrator.userCanAccess(userRole) && <OwnerNotificationPanel notifications={notifications} />}
          </>
        )}

        {activeTab === 'devices' && (
          <View style={styles.devicesSection}>
            <Text style={styles.sectionTitle}>Connected Devices</Text>
            <FlatList
              data={devices}
              keyExtractor={item => item.deviceId}
              renderItem={renderDeviceItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {activeTab === 'sync' && (
          <View style={styles.syncSection}>
            <Text style={styles.sectionTitle}>Sync Status</Text>
            <View style={styles.syncStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{devices.length}</Text>
                <Text style={styles.statLabel}>Total Devices</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {devices.filter(d => d.isAuthorized).length}
                </Text>
                <Text style={styles.statLabel}>Authorized</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {devices.reduce((sum, d) => sum + d.skills.length, 0)}
                </Text>
                <Text style={styles.statLabel}>Total Skills</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.syncAllButton} onPress={() => {
              devices.forEach(device => syncDevice(device.deviceId));
            }}>
              <Text style={styles.syncAllButtonText}>Sync All Devices</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  deviceCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  deviceStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  deviceDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: '#2196F3',
  },
  authorizeButton: {
    backgroundColor: '#4CAF50',
  },
  revokeButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  devicesSection: {
    marginBottom: 20,
  },
  syncSection: {
    marginBottom: 20,
  },
  syncStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    textTransform: 'uppercase',
  },
  syncAllButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  syncAllButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
