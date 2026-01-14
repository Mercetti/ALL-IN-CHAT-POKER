/**
 * Stats Card Component
 * Displays dashboard statistics in a card format
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DashboardStats } from '../types/dashboard';

interface StatsCardProps {
  stats: DashboardStats;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name="dashboard" size={24} color="#2196F3" />
        <Text style={styles.title}>Dashboard Overview</Text>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalSkills}</Text>
          <Text style={styles.statLabel}>Total Skills</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.installedSkills}</Text>
          <Text style={styles.statLabel}>Installed</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.availableSkills}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalTrustScore}%</Text>
          <Text style={styles.statLabel}>Avg Trust</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalDatasetEntries.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Dataset Entries</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.activePermissions.length}</Text>
          <Text style={styles.statLabel}>Active Permissions</Text>
        </View>
      </View>
      
      {stats.activePermissions.length > 0 && (
        <View style={styles.permissionsSection}>
          <Text style={styles.permissionsTitle}>Active Permissions:</Text>
          <View style={styles.permissionsList}>
            {stats.activePermissions.slice(0, 3).map((permission, index) => (
              <View key={index} style={styles.permissionTag}>
                <Text style={styles.permissionText}>{permission}</Text>
              </View>
            ))}
            {stats.activePermissions.length > 3 && (
              <Text style={styles.moreText}>+{stats.activePermissions.length - 3} more</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  permissionsSection: {
    marginTop: 8,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 8,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionTag: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  permissionText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  moreText: {
    fontSize: 11,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
});
