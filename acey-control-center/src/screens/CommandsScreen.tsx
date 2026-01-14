import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { sendCommand } from '../services/api';
import { useAceyStore } from '../state/aceyStore';

interface Command {
  id: string;
  title: string;
  description: string;
  intent: string;
  params: Record<string, any>;
  icon: string;
  risk: 'low' | 'medium' | 'high';
  requiresApproval?: boolean;
}

const CommandsScreen: React.FC = ({ navigation }: any) => {
  const { setLoading, setError } = useAceyStore();
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);

  const commands: Command[] = [
    {
      id: 'run_simulation',
      title: 'Run Simulation',
      description: 'Execute a new simulation cycle',
      intent: 'run_simulation',
      params: { scope: 'governance' },
      icon: 'play-arrow',
      risk: 'medium',
      requiresApproval: true,
    },
    {
      id: 'pause_autonomy',
      title: 'Pause Autonomy',
      description: 'Temporarily pause autonomous operations',
      intent: 'pause_autonomy',
      params: {},
      icon: 'pause',
      risk: 'medium',
      requiresApproval: true,
    },
    {
      id: 'trigger_audit',
      title: 'Trigger Audit',
      description: 'Initiate system audit and validation',
      intent: 'trigger_audit',
      params: { comprehensive: true },
      icon: 'fact-check',
      risk: 'low',
    },
    {
      id: 'deploy_model',
      title: 'Deploy Model',
      description: 'Deploy new AI model version',
      intent: 'deploy_model',
      params: { version: 'latest' },
      icon: 'system-update',
      risk: 'high',
      requiresApproval: true,
    },
    {
      id: 'backup_system',
      title: 'Backup System',
      description: 'Create system state backup',
      intent: 'backup_system',
      params: {},
      icon: 'backup',
      risk: 'low',
    },
    {
      id: 'restore_system',
      title: 'Restore System',
      description: 'Restore from backup',
      intent: 'restore_system',
      params: { backupId: 'latest' },
      icon: 'restore',
      risk: 'high',
      requiresApproval: true,
    },
    {
      id: 'clear_cache',
      title: 'Clear Cache',
      description: 'Clear system cache and temporary data',
      intent: 'clear_cache',
      params: {},
      icon: 'clear-all',
      risk: 'low',
    },
    {
      id: 'update_dataset',
      title: 'Update Dataset',
      description: 'Update training dataset',
      intent: 'update_dataset',
      params: { source: 'production' },
      icon: 'dataset',
      risk: 'medium',
      requiresApproval: true,
    },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#E8F5E8';
      case 'medium': return '#FFF3E0';
      case 'high': return '#FFEBEE';
      default: return '#F5F5F5';
    }
  };

  const handleCommand = async (command: Command) => {
    if (executingCommand) return;

    const message = command.requiresApproval
      ? `This command requires approval. It will be sent for review.`
      : `Execute "${command.title}"? This action cannot be undone.`;

    Alert.alert(
      'Confirm Command',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: command.requiresApproval ? 'Send for Approval' : 'Execute',
          style: command.requiresApproval ? 'default' : 'destructive',
          onPress: () => executeCommand(command),
        },
      ]
    );
  };

  const executeCommand = async (command: Command) => {
    try {
      setExecutingCommand(command.id);
      setLoading(true);

      const response = await sendCommand(command.intent, command.params);

      if (response.error) {
        setError(response.error);
        Alert.alert('Error', response.error);
      } else if (response.data) {
        if (response.data.requiresApproval) {
          Alert.alert(
            'Approval Required',
            'Command has been sent for approval. You will be notified when it\'s reviewed.'
          );
        } else {
          Alert.alert('Success', 'Command executed successfully');
        }
        setError(null);
      }
    } catch (error) {
      setError('Failed to execute command');
      Alert.alert('Error', 'Failed to execute command');
      console.error('Command execution error:', error);
    } finally {
      setLoading(false);
      setExecutingCommand(null);
    }
  };

  const groupedCommands = commands.reduce((groups, command) => {
    const category = command.requiresApproval ? 'requires_approval' : 'immediate';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(command);
    return groups;
  }, {} as Record<string, Command[]>);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Commands</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Immediate Commands */}
        {groupedCommands.immediate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Immediate Commands</Text>
            <Text style={styles.sectionSubtitle}>
              These commands execute immediately without approval
            </Text>
            
            {groupedCommands.immediate.map((command) => (
              <TouchableOpacity
                key={command.id}
                style={styles.commandCard}
                onPress={() => handleCommand(command)}
                disabled={executingCommand === command.id}
              >
                <View style={styles.commandHeader}>
                  <View style={styles.commandInfo}>
                    <Icon name={command.icon} size={24} color="#2196F3" />
                    <View style={styles.commandTitleContainer}>
                      <Text style={styles.commandTitle}>{command.title}</Text>
                      <View style={[styles.riskBadge, { backgroundColor: getRiskBadgeColor(command.risk) }]}>
                        <Text style={[styles.riskText, { color: getRiskColor(command.risk) }]}>
                          {command.risk.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {executingCommand === command.id ? (
                    <Text style={styles.executingText}>Executing...</Text>
                  ) : (
                    <Icon name="play-arrow" size={24} color="#4CAF50" />
                  )}
                </View>
                
                <Text style={styles.commandDescription}>{command.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Commands Requiring Approval */}
        {groupedCommands.requires_approval && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commands Requiring Approval</Text>
            <Text style={styles.sectionSubtitle}>
              These commands require approval before execution
            </Text>
            
            {groupedCommands.requires_approval.map((command) => (
              <TouchableOpacity
                key={command.id}
                style={[styles.commandCard, styles.approvalRequiredCard]}
                onPress={() => handleCommand(command)}
                disabled={executingCommand === command.id}
              >
                <View style={styles.commandHeader}>
                  <View style={styles.commandInfo}>
                    <Icon name={command.icon} size={24} color="#FF9800" />
                    <View style={styles.commandTitleContainer}>
                      <Text style={styles.commandTitle}>{command.title}</Text>
                      <View style={[styles.riskBadge, { backgroundColor: getRiskBadgeColor(command.risk) }]}>
                        <Text style={[styles.riskText, { color: getRiskColor(command.risk) }]}>
                          {command.risk.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {executingCommand === command.id ? (
                    <Text style={styles.executingText}>Sending...</Text>
                  ) : (
                    <Icon name="approval" size={24} color="#FF9800" />
                  )}
                </View>
                
                <Text style={styles.commandDescription}>{command.description}</Text>
                
                <View style={styles.approvalNotice}>
                  <Icon name="info" size={16} color="#FF9800" />
                  <Text style={styles.approvalNoticeText}>
                    Requires approval before execution
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Safety Notice */}
        <View style={styles.safetyNotice}>
          <Icon name="security" size={24} color="#2196F3" />
          <Text style={styles.safetyNoticeTitle}>Safety First</Text>
          <Text style={styles.safetyNoticeText}>
            All commands are monitored and logged. High-risk operations require approval to ensure system safety.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E1E1E',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 16,
  },
  commandCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  approvalRequiredCard: {
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  commandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commandTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  commandTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  riskText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  executingText: {
    fontSize: 14,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  commandDescription: {
    fontSize: 14,
    color: '#9E9E9E',
    lineHeight: 20,
  },
  approvalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  approvalNoticeText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 8,
    flex: 1,
  },
  safetyNotice: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2196F3',
    alignItems: 'center',
  },
  safetyNoticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 8,
  },
  safetyNoticeText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CommandsScreen;
