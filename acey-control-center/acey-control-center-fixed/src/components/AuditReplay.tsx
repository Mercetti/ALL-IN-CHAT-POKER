import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Slider } from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuditReplayService, AuditEvent, ReplaySession, ReplayContext } from '../services/auditReplay';

interface AuditReplayProps {
  visible: boolean;
  onClose: () => void;
}

const AuditReplay: React.FC<AuditReplayProps> = ({ visible, onClose }) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [currentSession, setCurrentSession] = useState<ReplaySession | null>(null);
  const [context, setContext] = useState<ReplayContext | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [startTime, setStartTime] = useState(Date.now() - 24 * 60 * 60 * 1000);
  const [endTime, setEndTime] = useState(Date.now());
  
  const [replayService] = useState(() => AuditReplayService.getInstance());
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      loadEvents();
      const currentContext = replayService.getReplayContext();
      setContext(currentContext);
      const session = replayService.getCurrentSession();
      setCurrentSession(session);
    }
  }, [visible]);

  const loadEvents = async () => {
    try {
      setRefreshing(true);
      const loadedEvents = await replayService.loadTimeline();
      setEvents(loadedEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSession = () => {
    if (!sessionName.trim()) {
      return;
    }

    const session = replayService.createReplaySession(
      sessionName,
      sessionDescription,
      startTime,
      endTime
    );

    setCurrentSession(session);
    setShowCreateSession(false);
    setSessionName('');
    setSessionDescription('');
  };

  const handleSeekToTime = (timestamp: number) => {
    if (!currentSession) return;

    const sessionEvents = replayService.seekToTime(timestamp);
    setContext(replayService.getReplayContext());
    
    // Scroll to the relevant event
    const nearestEvent = sessionEvents[sessionEvents.length - 1];
    if (nearestEvent && scrollViewRef.current) {
      // In a real implementation, you'd scroll to the event position
    }
  };

  const handleSeekToEvent = (event: AuditEvent) => {
    if (!currentSession) return;

    replayService.seekToEvent(event.id);
    setContext(replayService.getReplayContext());
    setSelectedEvent(event);
  };

  const handlePlayPause = () => {
    if (!context) return;

    const newContext = { ...context, isPlaying: !context.isPlaying };
    replayService.updateReplayContext(newContext);
    setContext(newContext);

    if (newContext.isPlaying) {
      // Start playback animation
      startPlayback();
    }
  };

  const startPlayback = () => {
    if (!context || !currentSession) return;

    const interval = setInterval(() => {
      const currentContext = replayService.getReplayContext();
      if (!currentContext.isPlaying || currentContext.currentTime >= currentSession.endTime) {
        clearInterval(interval);
        const stopContext = { ...currentContext, isPlaying: false };
        replayService.updateReplayContext(stopContext);
        setContext(stopContext);
        return;
      }

      const newTime = currentContext.currentTime + (1000 * currentContext.playbackSpeed);
      handleSeekToTime(newTime);
    }, 100);
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      LLM_CALL: '#2196F3',
      APPROVAL: '#4CAF50',
      AUTO_RULE: '#FF9800',
      ERROR: '#F44336',
      DEPLOY: '#9C27B0',
      PERMISSION_GRANT: '#00BCD4',
      BIOMETRIC_AUTH: '#795548',
      SYSTEM_LOCK: '#607D8B',
      MODEL_UPDATE: '#E91E63',
    };
    return colors[type] || '#9E9E9E';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return '#4CAF50';
      case 'MEDIUM': return '#FF9800';
      case 'HIGH': return '#F44336';
      case 'CRITICAL': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getTrustChangeColor = (impact: number) => {
    if (impact > 0) return '#4CAF50';
    if (impact < 0) return '#F44336';
    return '#9E9E9E';
  };

  const formatTimeRange = () => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  if (!context) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Audit Replay</Text>
          <TouchableOpacity onPress={loadEvents}>
            <Icon name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {currentSession ? (
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionName}>{currentSession.name}</Text>
            <Text style={styles.sessionDescription}>{currentSession.description}</Text>
            <View style={styles.sessionMeta}>
              <Text style={styles.sessionMetaText}>
                {new Date(currentSession.startTime).toLocaleString()} - {new Date(currentSession.endTime).toLocaleString()}
              </Text>
              <View style={styles.sessionControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handlePlayPause}
                >
                  <Icon 
                    name={context.isPlaying ? "pause" : "play-arrow"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setShowCreateSession(true)}
                >
                  <Icon name="edit" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noSession}>
            <Text style={styles.noSessionText}>No active session</Text>
            <TouchableOpacity
              style={styles.createSessionButton}
              onPress={() => setShowCreateSession(true)}
            >
              <Text style={styles.createSessionButtonText}>Create Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentSession && (
          <View style={styles.timelineContainer}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineTitle}>Timeline</Text>
              <Text style={styles.currentTime}>
                Current: {formatTimestamp(context.currentTime)}
              </Text>
            </View>
            
            <Slider
              style={styles.timelineSlider}
              minimumValue={currentSession.startTime}
              maximumValue={currentSession.endTime}
              value={context.currentTime}
              onValueChange={handleSeekToTime}
              minimumTrackTintColor="#2196F3"
              maximumTrackTintColor="#333333"
              thumbStyle={{ backgroundColor: '#2196F3', width: 20, height: 20 }}
            />

            <View style={styles.playbackControls}>
              <Text style={styles.playbackSpeed}>Speed: {context.playbackSpeed}x</Text>
              <View style={styles.playbackButtons}>
                {[0.5, 1, 2, 4].map(speed => (
                  <TouchableOpacity
                    key={speed}
                    style={[
                      styles.speedButton,
                      context.playbackSpeed === speed && styles.speedButtonActive
                    ]}
                    onPress={() => {
                      const newContext = { ...context, playbackSpeed: speed };
                      replayService.updateReplayContext(newContext);
                      setContext(newContext);
                    }}
                  >
                    <Text style={[
                      styles.speedButtonText,
                      context.playbackSpeed === speed && styles.speedButtonTextActive
                    ]}>
                      {speed}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          style={styles.eventsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadEvents} />
          }
        >
          {events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[
                styles.eventCard,
                selectedEvent?.id === event.id && styles.eventCardSelected
              ]}
              onPress={() => handleSeekToEvent(event)}
            >
              <View style={styles.eventHeader}>
                <View style={styles.eventTime}>
                  <Text style={styles.eventTimeText}>{formatTimestamp(event.time)}</Text>
                  <View style={[styles.eventTypeBadge, { backgroundColor: getEventTypeColor(event.type) }]}>
                    <Text style={styles.eventTypeText}>{event.type}</Text>
                  </View>
                </View>
                <View style={styles.eventImpact}>
                  <Icon 
                    name={event.trustImpact >= 0 ? "trending-up" : "trending-down"} 
                    size={16} 
                    color={getTrustChangeColor(event.trustImpact)} 
                  />
                  <Text style={[styles.eventImpactText, { color: getTrustChangeColor(event.trustImpact) }]}>
                    {(event.trustImpact * 100).toFixed(2)}%
                  </Text>
                </View>
              </View>
              
              <Text style={styles.eventSummary}>{event.summary}</Text>
              
              <View style={styles.eventMeta}>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(event.severity) }]}>
                  <Text style={styles.severityText}>{event.severity}</Text>
                </View>
                <Text style={styles.eventCategory}>{event.category}</Text>
              </View>

              {selectedEvent?.id === event.id && (
                <View style={styles.eventDetails}>
                  <Text style={styles.eventDetailsTitle}>Event Details</Text>
                  <Text style={styles.eventDetailsText}>{JSON.stringify(event.metadata, null, 2)}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowCreateSession(true)}
        >
          <Icon name="history" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Modal visible={showCreateSession} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create Replay Session</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Session Name</Text>
              <TextInput
                style={styles.input}
                value={sessionName}
                onChangeText={setSessionName}
                placeholder="Enter session name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={sessionDescription}
                onChangeText={setSessionDescription}
                placeholder="Enter session description"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Time Range</Text>
              <Text style={styles.timeRange}>{formatTimeRange()}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowCreateSession(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createModalButton]}
                onPress={handleCreateSession}
              >
                <Text style={styles.createModalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
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
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sessionInfo: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  sessionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sessionDescription: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionMetaText: {
    fontSize: 12,
    color: '#9E9E9E',
    flex: 1,
  },
  sessionControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    backgroundColor: '#2196F3',
    borderRadius: 16,
    padding: 8,
  },
  noSession: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noSessionText: {
    fontSize: 16,
    color: '#9E9E9E',
    marginBottom: 16,
  },
  createSessionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createSessionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timelineContainer: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  currentTime: {
    fontSize: 14,
    color: '#2196F3',
  },
  timelineSlider: {
    marginBottom: 12,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playbackSpeed: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  playbackButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  speedButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  speedButtonActive: {
    backgroundColor: '#2196F3',
  },
  speedButtonText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  speedButtonTextActive: {
    color: '#FFFFFF',
  },
  eventsList: {
    flex: 1,
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  eventCardSelected: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTimeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  eventTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  eventImpact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventImpactText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventSummary: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  eventCategory: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  eventDetails: {
    backgroundColor: '#2C2C2C',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  eventDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  eventDetailsText: {
    fontSize: 12,
    color: '#E0E0E0',
    fontFamily: 'monospace',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeRange: {
    fontSize: 14,
    color: '#9E9E9E',
    backgroundColor: '#2C2C2C',
    padding: 12,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#333333',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  createModalButton: {
    backgroundColor: '#2196F3',
  },
  createModalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default AuditReplay;
