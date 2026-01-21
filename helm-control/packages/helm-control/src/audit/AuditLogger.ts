/**
 * Audit Logger - Compliance and Activity Logging
 * Logs all actions for compliance and debugging
 */

export interface AuditEvent {
  timestamp: Date
  type: string
  data: any
  sessionId?: string
  userId?: string
  level: "info" | "warning" | "error" | "critical"
}

export class AuditLogger {
  private events: AuditEvent[] = []
  private enabled: boolean
  private maxEvents: number = 10000

  constructor(telemetry?: boolean) {
    this.enabled = !!telemetry
  }

  log(type: string, data: any, level: "info" | "warning" | "error" | "critical" = "info"): void {
    if (!this.enabled) {
      return
    }

    const event: AuditEvent = {
      timestamp: new Date(),
      type,
      data,
      level
    }

    this.events.push(event)

    // Trim events if too many
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.log(`[AUDIT] ${type}:`, data)
    }
  }

  getEvents(limit?: number): AuditEvent[] {
    if (limit) {
      return this.events.slice(-limit)
    }
    return [...this.events]
  }

  getEventsByType(type: string): AuditEvent[] {
    return this.events.filter(event => event.type === type)
  }

  getEventsByLevel(level: "info" | "warning" | "error" | "critical"): AuditEvent[] {
    return this.events.filter(event => event.level === level)
  }

  getEventsByTimeRange(start: Date, end: Date): AuditEvent[] {
    return this.events.filter(event => 
      event.timestamp >= start && event.timestamp <= end
    )
  }

  clear(): void {
    this.events = []
  }

  flush(): void {
    // In production, this would send events to external logging service
    console.log(`Flushing ${this.events.length} audit events`)
    this.clear()
  }

  export(): string {
    return JSON.stringify(this.events, null, 2)
  }

  import(jsonData: string): void {
    try {
      const imported = JSON.parse(jsonData)
      if (Array.isArray(imported)) {
        this.events = imported
      }
    } catch (error) {
      console.error("Failed to import audit events:", error)
    }
  }

  getStatistics(): any {
    const stats = {
      totalEvents: this.events.length,
      byType: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      timeRange: {
        earliest: this.events.length > 0 ? this.events[0].timestamp : null,
        latest: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : null
      }
    }

    this.events.forEach(event => {
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1
      stats.byLevel[event.level] = (stats.byLevel[event.level] || 0) + 1
    })

    return stats
  }

  search(query: string): AuditEvent[] {
    const lowerQuery = query.toLowerCase()
    return this.events.filter(event => {
      const eventString = JSON.stringify(event).toLowerCase()
      return eventString.includes(lowerQuery)
    })
  }
}
