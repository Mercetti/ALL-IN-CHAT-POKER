/**
 * Helm Events - Event Management System
 * Provides event-driven communication between Helm components
 */

import { 
  HelmEventsInterface, 
  HelmEventHandler, 
  HelmEventType,
  HelmSessionEvent
} from '../types/public';

export class HelmEvents implements HelmEventsInterface {
  private eventHandlers: Map<string, HelmEventHandler[]> = new Map();
  private maxHandlers: number = 100;
  private eventHistory: HelmSessionEvent[] = [];
  private maxHistory: number = 1000;

  /**
   * Register event handler
   */
  on(event: string, handler: HelmEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }

    const handlers = this.eventHandlers.get(event)!;
    
    // Check handler limit
    if (handlers.length >= this.maxHandlers) {
      throw new Error(`Maximum handlers (${this.maxHandlers}) exceeded for event: ${event}`);
    }

    handlers.push(handler);
  }

  /**
   * Remove event handler
   */
  off(event: string, handler: HelmEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all handlers
   */
  emit(event: string, data: unknown): void {
    const sessionEvent: HelmSessionEvent = {
      type: event,
      data,
      timestamp: new Date(),
      sessionId: 'global' // Global events don't have session context
    };

    // Add to history
    this.addToHistory(sessionEvent);

    // Notify handlers
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(sessionEvent);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
          // Emit error event
          this.emit('handler_error', { 
            originalEvent: event, 
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date()
          });
        }
      });
    }
  }

  /**
   * Register handler for specific event type
   */
  onTyped<T>(eventType: HelmEventType, handler: (event: HelmSessionEvent & { data: T }) => void): void {
    this.on(eventType, handler as HelmEventHandler);
  }

  /**
   * Remove handler for specific event type
   */
  offTyped<T>(eventType: HelmEventType, handler: (event: HelmSessionEvent & { data: T }) => void): void {
    this.off(eventType, handler as HelmEventHandler);
  }

  /**
   * Emit typed event
   */
  emitTyped<T>(eventType: HelmEventType, data: T): void {
    this.emit(eventType, data);
  }

  /**
   * Get event history
   */
  getHistory(limit?: number): HelmSessionEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get handler count for event
   */
  getHandlerCount(event: string): number {
    return this.eventHandlers.get(event)?.length || 0;
  }

  /**
   * Get all registered events
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.eventHandlers.keys());
  }

  /**
   * Remove all handlers for event
   */
  removeAllHandlers(event: string): void {
    this.eventHandlers.delete(event);
  }

  /**
   * Remove all handlers for all events
   */
  clearAllHandlers(): void {
    this.eventHandlers.clear();
  }

  /**
   * Check if event has handlers
   */
  hasHandlers(event: string): boolean {
    const handlers = this.eventHandlers.get(event);
    return !!(handlers && handlers.length > 0);
  }

  /**
   * Wait for event to occur (Promise-based)
   */
  waitForEvent(event: string, timeout?: number): Promise<HelmSessionEvent> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null;

      const handler = (sessionEvent: HelmSessionEvent) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        this.off(event, handler);
        resolve(sessionEvent);
      };

      this.on(event, handler);

      if (timeout) {
        timeoutId = setTimeout(() => {
          this.off(event, handler);
          reject(new Error(`Timeout waiting for event: ${event}`));
        }, timeout);
      }
    });
  }

  /**
   * Create event emitter for specific namespace
   */
  namespaced(namespace: string): HelmEvents {
    const namespacedEvents = new HelmEvents();
    
    // Proxy events through with namespace prefix
    const originalEmit = namespacedEvents.emit.bind(namespacedEvents);
    namespacedEvents.emit = (event: string, data: unknown) => {
      originalEmit(`${namespace}.${event}`, data);
    };

    return namespacedEvents;
  }

  /**
   * Get event statistics
   */
  getStatistics(): any {
    const stats = {
      totalEvents: this.eventHistory.length,
      registeredEvents: this.eventHandlers.size,
      totalHandlers: 0,
      eventTypes: {} as Record<string, number>,
      handlerCounts: {} as Record<string, number>
    };

    // Count handlers per event
    for (const [event, handlers] of this.eventHandlers) {
      stats.handlerCounts[event] = handlers.length;
      stats.totalHandlers += handlers.length;
    }

    // Count event types in history
    for (const event of this.eventHistory) {
      stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1;
    }

    return stats;
  }

  /**
   * Set maximum handlers per event
   */
  setMaxHandlers(max: number): void {
    this.maxHandlers = Math.max(1, max);
  }

  /**
   * Set maximum history size
   */
  setMaxHistory(max: number): void {
    this.maxHistory = Math.max(0, max);
    
    // Trim history if needed
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistory);
    }
  }

  // Private methods

  private addToHistory(event: HelmSessionEvent): void {
    this.eventHistory.push(event);
    
    // Trim history if needed
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }
  }
}
