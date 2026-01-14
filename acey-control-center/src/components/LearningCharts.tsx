import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LearningMetrics } from '../services/metricsService';

const screenWidth = Dimensions.get('window').width;

interface LearningChartsProps {
  metrics: LearningMetrics;
}

export default function LearningCharts({ metrics }: LearningChartsProps) {
  const skillTrustData = metrics.skillTrust || {
    code: 0.85,
    audio: 0.90,
    graphics: 0.95,
    link: 0.80
  };

  const trustScores = Object.entries(skillTrustData).map(([skill, score]) => ({
    skill,
    score: (score as number) * 100
  }));

  const maxScore = Math.max(...trustScores.map(t => t.score));

  return (
    <View style={styles.container}>
      {/* Dataset Overview */}
      <View style={styles.section}>
        <Text style={styles.title}>Learning Overview</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{metrics.datasetSize}</Text>
            <Text style={styles.statLabel}>Dataset Size</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{Math.round(metrics.fineTuneProgress * 100)}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{metrics.queueSize}</Text>
            <Text style={styles.statLabel}>Queue Size</Text>
          </View>
        </View>
      </View>

      {/* Skill Trust Scores Bar Chart */}
      <View style={styles.section}>
        <Text style={styles.title}>Skill Trust Scores</Text>
        <View style={styles.chartContainer}>
          {trustScores.map((item, index) => (
            <View key={item.skill} style={styles.barContainer}>
              <Text style={styles.barLabel}>{item.skill.toUpperCase()}</Text>
              <View style={styles.barTrack}>
                <View 
                  style={[
                    styles.barFill,
                    { 
                      width: `${(item.score / maxScore) * 100}%`,
                      backgroundColor: getSkillColor(item.skill)
                    }
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{item.score.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Fine-Tune Progress */}
      <View style={styles.section}>
        <Text style={styles.title}>Fine-Tune Progress</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill,
                { width: `${metrics.fineTuneProgress * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(metrics.fineTuneProgress * 100)}% Complete
          </Text>
        </View>
        <Text style={styles.subtitle}>Model Version: {metrics.modelVersion}</Text>
        <Text style={styles.subtitle}>Last Fine-Tune: {new Date(metrics.lastFineTuneTime).toLocaleDateString()}</Text>
      </View>
    </View>
  );
}

function getSkillColor(skill: string): string {
  switch (skill) {
    case 'code': return '#007AFF';
    case 'audio': return '#AF52DE';
    case 'graphics': return '#FF9500';
    case 'link': return '#34C759';
    default: return '#8E8E93';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 25,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 15,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 10,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2280b0',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    paddingHorizontal: 10,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 60,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 10,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2,
  },
  barValue: {
    width: 45,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  progressContainer: {
    paddingHorizontal: 10,
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 6,
    minWidth: 2,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    textAlign: 'center',
    marginBottom: 5,
  },
});
