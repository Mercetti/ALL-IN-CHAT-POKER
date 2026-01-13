import { AceyOutput } from "../contracts/output";
import { SimulationEvent, ModelComparison, SimulationConfig, SimulationState } from "../types/simulation";

export class SimulationEngine {
  private state: SimulationState;
  private eventLog: SimulationEvent[] = [];
  private comparisonLog: ModelComparison[] = [];
  private playbackInterval: NodeJS.Timeout | null = null;

  constructor(config: SimulationConfig) {
    this.state = {
      isPlaying: false,
      currentTime: config.startTime || Date.now(),
      events: [],
      comparison: [],
      config
    };
  }

  // Load simulation data from file or stream
  async loadSimulationData(dataSource: string): Promise<void> {
    try {
      if (dataSource.startsWith('file://')) {
        const filePath = dataSource.replace('file://', '');
        const fs = await import('fs');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        this.processSimulationData(data);
      } else if (dataSource.startsWith('stream://')) {
        // Load from live stream or database
        await this.loadFromStream(dataSource);
      }
    } catch (error) {
      console.error('Failed to load simulation data:', error);
      throw error;
    }
  }

  // Process raw simulation data
  private processSimulationData(data: any): void {
    this.eventLog = data.events || [];
    this.comparisonLog = data.comparisons || [];
    
    this.state.events = this.eventLog;
    this.state.comparison = this.comparisonLog;
  }

  // Load from live stream
  private async loadFromStream(streamSource: string): Promise<void> {
    // Implementation for loading from live stream
    console.log(`Loading simulation data from stream: ${streamSource}`);
  }

  // Start playback
  startPlayback(): void {
    if (this.state.isPlaying) return;
    
    this.state.isPlaying = true;
    const intervalMs = 1000 / this.state.config.playbackSpeed;
    
    this.playbackInterval = setInterval(() => {
      this.stepForward();
    }, intervalMs);
  }

  // Pause playback
  pausePlayback(): void {
    this.state.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  // Step forward one event
  stepForward(): void {
    if (this.state.events.length === 0) return;
    
    const nextEvent = this.state.events.find(
      event => event.timestamp > this.state.currentTime
    );
    
    if (nextEvent) {
      this.state.currentTime = nextEvent.timestamp;
      this.processEvent(nextEvent);
    } else {
      // End of simulation
      this.pausePlayback();
    }
  }

  // Process individual event
  private processEvent(event: SimulationEvent): void {
    console.log(`Processing event: ${event.eventType} at ${new Date(event.timestamp).toLocaleTimeString()}`);
    
    // Emit event to dashboard
    if (this.state.config.dryRun) {
      console.log('[DRY RUN] Would process:', event);
    } else {
      // Actually process the event
      this.executeEvent(event);
    }
  }

  // Execute event (non-dry-run)
  private executeEvent(event: SimulationEvent): void {
    // Implementation would call actual Control Center functions
    console.log('Executing event:', event);
  }

  // Compare two model outputs
  compareModels(modelAOutput: AceyOutput, modelBOutput: AceyOutput): ModelComparison {
    const differences: string[] = [];
    
    // Compare speech
    if (modelAOutput.speech !== modelBOutput.speech) {
      differences.push(`Speech changed: "${modelAOutput.speech}" → "${modelBOutput.speech}"`);
    }
    
    // Compare intents
    const aIntents = modelAOutput.intents.map(i => i.type);
    const bIntents = modelBOutput.intents.map(i => i.type);
    
    const removedIntents = aIntents.filter(i => !bIntents.includes(i));
    const addedIntents = bIntents.filter(i => !aIntents.includes(i));
    
    if (removedIntents.length > 0) {
      differences.push(`Removed intents: ${removedIntents.join(', ')}`);
    }
    
    if (addedIntents.length > 0) {
      differences.push(`Added intents: ${addedIntents.join(', ')}`);
    }
    
    // Compare confidence scores
    const aConfidence = modelAOutput.intents.reduce((sum, intent) => {
      const confidence = (intent as any).confidence || 0;
      return sum + confidence;
    }, 0) / modelAOutput.intents.length;
    const bConfidence = modelBOutput.intents.reduce((sum, intent) => {
      const confidence = (intent as any).confidence || 0;
      return sum + confidence;
    }, 0) / modelBOutput.intents.length;
    
    if (Math.abs(aConfidence - bConfidence) > 0.1) {
      differences.push(`Confidence changed: ${aConfidence.toFixed(2)} → ${bConfidence.toFixed(2)}`);
    }
    
    const comparison: ModelComparison = {
      timestamp: Date.now(),
      modelA: {
        speech: modelAOutput.speech,
        intents: modelAOutput.intents,
        confidence: aConfidence
      },
      modelB: {
        speech: modelBOutput.speech,
        intents: modelBOutput.intents,
        confidence: bConfidence
      },
      differences
    };
    
    this.comparisonLog.push(comparison);
    this.state.comparison = this.comparisonLog;
    
    return comparison;
  }

  // Jump to specific time
  jumpToTime(timestamp: number): void {
    this.state.currentTime = timestamp;
    this.pausePlayback();
  }

  // Jump to specific event type
  jumpToEventType(eventType: string): void {
    const event = this.state.events.find(e => e.eventType === eventType);
    if (event) {
      this.jumpToTime(event.timestamp);
    }
  }

  // Reset simulation
  reset(): void {
    this.pausePlayback();
    this.state.currentTime = this.state.config.startTime || Date.now();
    this.state.events = [];
    this.state.comparison = [];
    this.eventLog = [];
    this.comparisonLog = [];
  }

  // Export simulation results
  exportResults(): string {
    const exportData = {
      timestamp: Date.now(),
      config: this.state.config,
      events: this.state.events,
      comparisons: this.state.comparison,
      summary: {
        totalEvents: this.state.events.length,
        totalComparisons: this.state.comparison.length,
        duration: this.state.currentTime - (this.state.config.startTime || Date.now())
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // Get current state
  getState(): SimulationState {
    return { ...this.state };
  }

  // Update configuration
  updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.state.config = { ...this.state.config, ...newConfig };
    
    // Restart playback if playing to apply new speed
    if (this.state.isPlaying) {
      this.pausePlayback();
      this.startPlayback();
    }
  }

  // Filter events by type
  filterEventsByType(eventType: string): SimulationEvent[] {
    return this.state.events.filter(event => event.eventType === eventType);
  }

  // Get events in time range
  getEventsInTimeRange(startTime: number, endTime: number): SimulationEvent[] {
    return this.state.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  // Calculate statistics
  getStatistics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    averageConfidence: number;
    timeSpan: number;
  } {
    const eventsByType: Record<string, number> = {};
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    this.state.events.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      
      const confidence = (event.intent as any).confidence;
      if (confidence) {
        totalConfidence += confidence;
        confidenceCount++;
      }
    });
    
    const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    const timeSpan = this.state.events.length > 0 ? 
      Math.max(...this.state.events.map(e => e.timestamp)) - 
      Math.min(...this.state.events.map(e => e.timestamp)) : 0;
    
    return {
      totalEvents: this.state.events.length,
      eventsByType,
      averageConfidence,
      timeSpan
    };
  }
}
