// components/NotificationManager.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { AceyAdminOrchestrator } from '../services/aceyAdminOrchestrator';
import { getUserAccess, checkTrialExpirations } from '../services/monetizationService';
import { canAccessAceyLab } from '../services/authService';

interface NotificationManagerProps {
  userToken: string;
  ownerToken?: string;
  userRole: string;
  username: string;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  userToken,
  ownerToken,
  userRole,
  username
}) => {
  const [userAccess, setUserAccess] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [canAccessLab, setCanAccessLab] = useState(false);

  // Initialize orchestrator for owner/dev
  const orchestrator = ownerToken ? new AceyAdminOrchestrator(ownerToken) : null;

  useEffect(() => {
    // Check if user can access Acey Lab
    setCanAccessLab(canAccessAceyLab(userRole));

    // User notification monitoring
    const userInterval = setInterval(async () => {
      if (!notificationsEnabled) return;
      
      // Fetch user access info including trial data
      const accessData = await getUserAccess(userToken);
      setUserAccess(accessData);

      // Check for trial expirations
      if (accessData.trials) {
        await checkTrialExpirations(userToken, accessData.trials);
      }
    }, 3600 * 1000); // Check every hour

    // Owner/Dev notification monitoring
    if (orchestrator && canAccessAceyLab(userRole)) {
      orchestrator.runFullMonitoringLoop(3600 * 1000); // Hourly updates
    }

    return () => {
      clearInterval(userInterval);
    };
  }, [userToken, ownerToken, userRole, notificationsEnabled]);

  const handleSkillUnlock = async (skillName: string) => {
    if (orchestrator) {
      await orchestrator.handleSkillUnlock(username, userToken, skillName);
    }
  };

  const handleLockedAccess = async (skillName: string) => {
    if (orchestrator) {
      await orchestrator.logLockedAccess(username, skillName);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>
      
      <View style={styles.setting}>
        <Text>Enable Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
      </View>

      {canAccessLab && (
        <View style={styles.adminSection}>
          <Text style={styles.adminTitle}>Admin Monitoring</Text>
          <Text style={styles.adminStatus}>
            Owner/Dev notifications active
          </Text>
        </View>
      )}

      {userAccess && (
        <View style={styles.accessSection}>
          <Text style={styles.accessTitle}>Current Access</Text>
          <Text>Skills: {userAccess.skills?.length || 0}</Text>
          <Text>Trials: {userAccess.trials?.length || 0}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  adminSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f4e8',
    borderRadius: 8,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  adminStatus: {
    fontSize: 14,
    color: '#2e7d32',
  },
  accessSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  accessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});
