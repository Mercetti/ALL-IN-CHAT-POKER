import { apiGet, apiPost } from './api';

export type AuditEventType = 
  | 'LLM_CALL'
  | 'APPROVAL'
  | 'AUTO_RULE'
  | 'ERROR'
  | 'DEPLOY'
  | 'PERMISSION_GRANT'
  | 'BIOMETRIC_AUTH'
  | 'SYSTEM_LOCK'
  | 'MODEL_UPDATE';

export interface AuditEvent {
  id: string;
  time: number;
  type: AuditEventType;
  summary: string;
  trustImpact: number;
  metadata: Record<string, any>;
  userId?: string;
  deviceId?: string;
  sessionId?: string;
  parentEventId?: string;
  childEventIds?: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'SYSTEM' | 'USER' | 'AI' | 'SECURITY' | 'ERROR';
}

export interface TimelineFilter {
  startTime?: number;
  endTime?: number;
  eventTypes?: AuditEventType[];
  severity?: string[];
  categories?: string[];
  userId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ReplaySession {
  id: string;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  events: AuditEvent[];
  mode: 'READ_ONLY' | 'SIMULATED' | 'DIFF';
  createdAt: number;
  createdBy: string;
}

export interface ReplayContext {
  currentTime: number;
  selectedEvent?: AuditEvent;
  mode: 'READ_ONLY' | 'SIMULATED' | 'DIFF';
  playbackSpeed: number;
  isPlaying: boolean;
  filters: TimelineFilter;
}

export interface SimulationResult {
  originalEvent: AuditEvent;
  simulatedEvent: AuditEvent;
  differences: Array<{
    field: string;
    original: any;
    simulated: any;
    impact: string;
  }>;
  overallImpact: 'NONE' | 'MINOR' | 'MODERATE' | 'MAJOR';
}

export class AuditReplayService {
  private static instance: AuditReplayService;
  private timelineEvents: AuditEvent[] = [];
  private currentSession: ReplaySession | null = null;
  private replayContext: ReplayContext;

  private constructor() {
    this.replayContext = {
      currentTime: Date.now(),
      mode: 'READ_ONLY',
      playbackSpeed: 1.0,
      isPlaying: false,
      filters: {},
    };
  }

  static getInstance(): AuditReplayService {
    if (!AuditReplayService.instance) {
      AuditReplayService.instance = new AuditReplayService();
    }
    return AuditReplayService.instance;
  }

  async loadTimeline(filter?: TimelineFilter): Promise<AuditEvent[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filter?.startTime) queryParams.append('start_time', filter.startTime.toString());
      if (filter?.endTime) queryParams.append('end_time', filter.endTime.toString());
      if (filter?.eventTypes) queryParams.append('event_types', filter.eventTypes.join(','));
      if (filter?.severity) queryParams.append('severity', filter.severity.join(','));
      if (filter?.categories) queryParams.append('categories', filter.categories.join(','));
      if (filter?.userId) queryParams.append('user_id', filter.userId);
      if (filter?.search) queryParams.append('search', filter.search);
      if (filter?.limit) queryParams.append('limit', filter.limit.toString());
      if (filter?.offset) queryParams.append('offset', filter.offset.toString());

      const response = await apiGet<AuditEvent[]>(`/audit/timeline?${queryParams.toString()}`);
      
      if (response.data && !response.error) {
        this.timelineEvents = response.data.sort((a, b) => b.time - a.time);
        return this.timelineEvents;
      }

      return [];
    } catch (error) {
      console.error('Failed to load timeline:', error);
      return [];
    }
  }

  async getEventDetails(eventId: string): Promise<AuditEvent | null> {
    try {
      const response = await apiGet<AuditEvent>(`/audit/event/${eventId}`);
      
      if (response.data && !response.error) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to get event details:', error);
      return null;
    }
  }

  async getEventChain(eventId: string): Promise<AuditEvent[]> {
    try {
      const response = await apiGet<AuditEvent[]>(`/audit/chain/${eventId}`);
      
      if (response.data && !response.error) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to get event chain:', error);
      return [];
    }
  }

  createReplaySession(
    name: string,
    description: string,
    startTime: number,
    endTime: number,
    mode: 'READ_ONLY' | 'SIMULATED' | 'DIFF' = 'READ_ONLY'
  ): ReplaySession {
    const events = this.timelineEvents.filter(
      event => event.time >= startTime && event.time <= endTime
    );

    this.currentSession = {
      id: `session_${Date.now()}`,
      name,
      description,
      startTime,
      endTime,
      events,
      mode,
      createdAt: Date.now(),
      createdBy: 'current_user', // Would get from auth context
    };

    this.replayContext.currentTime = startTime;
    this.replayContext.mode = mode;
    this.replayContext.filters = {
      startTime,
      endTime,
    };

    return this.currentSession;
  }

  getCurrentSession(): ReplaySession | null {
    return this.currentSession;
  }

  getReplayContext(): ReplayContext {
    return { ...this.replayContext };
  }

  updateReplayContext(updates: Partial<ReplayContext>): void {
    this.replayContext = { ...this.replayContext, ...updates };
  }

  seekToTime(timestamp: number): AuditEvent[] {
    if (!this.currentSession) return [];

    this.replayContext.currentTime = timestamp;
    
    return this.currentSession.events.filter(
      event => event.time <= timestamp
    );
  }

  seekToEvent(eventId: string): AuditEvent | null {
    if (!this.currentSession) return null;

    const event = this.currentSession.events.find(e => e.id === eventId);
    if (event) {
      this.replayContext.currentTime = event.time;
      this.replayContext.selectedEvent = event;
    }

    return event || null;
  }

  async simulateEvent(
    originalEvent: AuditEvent,
    newRules?: Record<string, any>
  ): Promise<SimulationResult> {
    try {
      const response = await apiPost<SimulationResult>('/audit/simulate', {
        event_id: originalEvent.id,
        new_rules: newRules,
        current_time: this.replayContext.currentTime,
      });

      if (response.data && !response.error) {
        return response.data;
      }

      // Fallback simulation result
      return {
        originalEvent,
        simulatedEvent: { ...originalEvent, id: `sim_${originalEvent.id}` },
        differences: [],
        overallImpact: 'NONE',
      };
    } catch (error) {
      console.error('Failed to simulate event:', error);
      throw error;
    }
  }

  async compareWithHistorical(
    eventId: string,
    historicalPeriod: number = 7 * 24 * 60 * 60 * 1000 // 7 days
  ): Promise<AuditEvent[]> {
    try {
      const now = Date.now();
      const historicalStart = now - historicalPeriod;

      const response = await apiGet<AuditEvent[]>(
        `/audit/compare/${eventId}?historical_start=${historicalStart}&historical_end=${now}`
      );

      if (response.data && !response.error) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to compare with historical:', error);
      return [];
    }
  }

  getEventSummary(event: AuditEvent): {
    impact: string;
    riskLevel: string;
    trustChange: string;
    relatedEvents: number;
  } {
    const impact = this.calculateImpact(event);
    const riskLevel = this.getRiskLevel(event);
    const trustChange = this.getTrustChange(event);
    const relatedEvents = (event.childEventIds?.length || 0) + (event.parentEventId ? 1 : 0);

    return {
      impact,
      riskLevel,
      trustChange,
      relatedEvents,
    };
  }

  private calculateImpact(event: AuditEvent): string {
    if (event.trustImpact > 0.1) return 'High Positive Impact';
    if (event.trustImpact > 0.05) return 'Moderate Positive Impact';
    if (event.trustImpact > 0) return 'Low Positive Impact';
    if (event.trustImpact > -0.05) return 'Low Negative Impact';
    if (event.trustImpact > -0.1) return 'Moderate Negative Impact';
    return 'High Negative Impact';
  }

  private getRiskLevel(event: AuditEvent): string {
    switch (event.severity) {
      case 'CRITICAL': return 'Critical Risk';
      case 'HIGH': return 'High Risk';
      case 'MEDIUM': return 'Medium Risk';
      case 'LOW': return 'Low Risk';
      default: return 'Unknown Risk';
    }
  }

  private getTrustChange(event: AuditEvent): string {
    const change = event.trustImpact;
    if (change > 0) {
      return `+${(change * 100).toFixed(2)}% Trust`;
    } else if (change < 0) {
      return `${(change * 100).toFixed(2)}% Trust`;
    }
    return 'No Trust Change';
  }

  getTimelineStatistics(events: AuditEvent[]): {
    totalEvents: number;
    timeSpan: number;
    trustChange: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topImpacts: AuditEvent[];
  } {
    if (events.length === 0) {
      return {
        totalEvents: 0,
        timeSpan: 0,
        trustChange: 0,
        eventsByType: {},
        eventsBySeverity: {},
        topImpacts: [],
      };
    }

    const startTime = Math.min(...events.map(e => e.time));
    const endTime = Math.max(...events.map(e => e.time));
    const timeSpan = endTime - startTime;

    const trustChange = events.reduce((sum, event) => sum + event.trustImpact, 0);

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    const topImpacts = events
      .sort((a, b) => Math.abs(b.trustImpact) - Math.abs(a.trustImpact))
      .slice(0, 5);

    return {
      totalEvents: events.length,
      timeSpan,
      trustChange,
      eventsByType,
      eventsBySeverity,
      topImpacts,
    };
  }

  exportSessionData(): string {
    if (!this.currentSession) return '';

    const exportData = {
      session: this.currentSession,
      context: this.replayContext,
      exportedAt: Date.now(),
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }

  importSessionData(data: string): boolean {
    try {
      const importData = JSON.parse(data);
      
      if (importData.session && importData.context) {
        this.currentSession = importData.session;
        this.replayContext = importData.context;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to import session data:', error);
      return false;
    }
  }

  cleanup(): void {
    this.timelineEvents = [];
    this.currentSession = null;
    this.replayContext = {
      currentTime: Date.now(),
      mode: 'READ_ONLY',
      playbackSpeed: 1.0,
      isPlaying: false,
      filters: {},
    };
  }
}

export default AuditReplayService.getInstance();
