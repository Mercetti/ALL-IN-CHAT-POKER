import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { GeneratedOutput } from '../types/skills';
import { aceyLearningDataset } from '../memory/aceyLearningDataset';

export const MemoryDashboard: React.FC = () => {
  const total = aceyLearningDataset.length;
  const approved = aceyLearningDataset.filter(p => p.feedback === 'approve').length;
  const needsImprovement = aceyLearningDataset.filter(p => p.feedback === 'needs_improvement').length;
  const averageTrustScore = total > 0 ? aceyLearningDataset.reduce((sum, p) => sum + (p.trustScore || 0), 0) / total : 0;
  
  const skillsBreakdown = aceyLearningDataset.reduce((acc, p) => {
    acc[p.skill] = (acc[p.skill] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const contentTypeBreakdown = aceyLearningDataset.reduce((acc, p) => {
    const type = p.contentType || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentActivity = aceyLearningDataset
    .slice(-5)
    .map(p => ({
      skill: p.skill,
      timestamp: new Date(p.timestamp).toLocaleString(),
      feedback: p.feedback || 'No feedback'
    }));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Acey Memory Dashboard</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Outputs</Text>
          <Text style={styles.statValue}>{total}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Approved</Text>
          <Text style={[styles.statValue, styles.approved]}>{approved}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Needs Improvement</Text>
          <Text style={[styles.statValue, styles.needsImprovement]}>{needsImprovement}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Trust Avg</Text>
          <Text style={[styles.statValue, styles.trustScore]}>{averageTrustScore.toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={styles.breakdownSection}>
        <Text style={styles.sectionTitle}>Skill Breakdown</Text>
        {Object.entries(skillsBreakdown).map(([skill, count]) => (
          <View key={skill} style={styles.breakdownItem}>
            <Text style={styles.breakdownSkill}>{skill}</Text>
            <Text style={styles.breakdownCount}>{count}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.breakdownSection}>
        <Text style={styles.sectionTitle}>Content Types</Text>
        {Object.entries(contentTypeBreakdown).map(([type, count]) => (
          <View key={type} style={styles.breakdownItem}>
            <Text style={styles.breakdownSkill}>{type}</Text>
            <Text style={styles.breakdownCount}>{count}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <ScrollView style={styles.recentList}>
          {recentActivity.map((activity, index) => (
            <View key={index} style={styles.recentItem}>
              <Text style={styles.recentSkill}>{activity.skill}</Text>
              <Text style={styles.recentTime}>{activity.timestamp}</Text>
              <Text style={[styles.recentFeedback, 
                activity.feedback === 'approve' ? styles.approvedFeedback : 
                activity.feedback === 'needs_improvement' ? styles.needsImprovementFeedback : 
                styles.noFeedback
              ]}>
                {activity.feedback === 'approve' ? '👍' : 
                 activity.feedback === 'needs_improvement' ? '👎' : '⏳'}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#111',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    minWidth: '45%',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  approved: {
    color: '#4CAF50',
  },
  needsImprovement: {
    color: '#FF9800',
  },
  trustScore: {
    color: '#2196F3',
  },
  breakdownSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  breakdownSkill: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  breakdownCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  recentSection: {
    flex: 1,
  },
  recentList: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 12,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  recentSkill: {
    fontSize: 12,
    color: '#fff',
    flex: 1,
  },
  recentTime: {
    fontSize: 10,
    color: '#ccc',
    marginLeft: 8,
  },
  recentFeedback: {
    fontSize: 12,
  },
  approvedFeedback: {
    color: '#4CAF50',
  },
  needsImprovementFeedback: {
    color: '#FF9800',
  },
  noFeedback: {
    color: '#666',
  },
});

export default MemoryDashboard;
