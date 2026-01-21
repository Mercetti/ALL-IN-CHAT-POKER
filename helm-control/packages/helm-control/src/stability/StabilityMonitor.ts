/**
 * Stability Monitor - System Health Monitoring
 * Monitors system health and enforces stability policies
 */

export interface StabilityMetrics {
  memoryUsage: number
  cpuUsage: number
  activeConnections: number
  errorRate: number
  responseTime: number
  uptime: number
}

export type StabilityState = "normal" | "degraded" | "minimal" | "safe" | "shutdown"

export class StabilityMonitor {
  private metrics: StabilityMetrics
  private state: StabilityState = "normal"
  private monitoring: boolean = false
  private thresholds = {
    memory: 1024 * 1024 * 1024, // 1GB
    cpu: 80, // 80%
    connections: 100,
    errorRate: 0.05, // 5%
    responseTime: 1000 // 1 second
  }

  constructor() {
    this.metrics = {
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0,
      errorRate: 0,
      responseTime: 0,
      uptime: 0
    }
  }

  start(): void {
    this.monitoring = true
    this.updateMetrics()
  }

  stop(): void {
    this.monitoring = false
  }

  shutdown(): void {
    this.monitoring = false
    this.state = "shutdown"
  }

  check(): void {
    if (!this.monitoring) {
      return
    }

    this.updateMetrics()
    this.evaluateState()
  }

  getCurrentState(): StabilityState {
    return this.state
  }

  getMetrics(): StabilityMetrics {
    return { ...this.metrics }
  }

  private updateMetrics(): void {
    // Simulate metrics collection
    this.metrics.memoryUsage = Math.random() * this.thresholds.memory
    this.metrics.cpuUsage = Math.random() * 100
    this.metrics.activeConnections = Math.floor(Math.random() * this.thresholds.connections)
    this.metrics.errorRate = Math.random() * 0.1
    this.metrics.responseTime = Math.random() * 2000
    this.metrics.uptime = Date.now()
  }

  private evaluateState(): void {
    const { metrics, thresholds } = this

    if (metrics.memoryUsage > thresholds.memory * 0.95 ||
        metrics.cpuUsage > 95 ||
        metrics.errorRate > 0.1) {
      this.state = "shutdown"
    } else if (metrics.memoryUsage > thresholds.memory * 0.8 ||
               metrics.cpuUsage > 85 ||
               metrics.errorRate > 0.05) {
      this.state = "safe"
    } else if (metrics.memoryUsage > thresholds.memory * 0.6 ||
               metrics.cpuUsage > 70 ||
               metrics.responseTime > thresholds.responseTime) {
      this.state = "minimal"
    } else if (metrics.memoryUsage > thresholds.memory * 0.4 ||
               metrics.cpuUsage > 50) {
      this.state = "degraded"
    } else {
      this.state = "normal"
    }
  }

  setThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds }
  }

  isHealthy(): boolean {
    return this.state === "normal" || this.state === "degraded"
  }

  isOperational(): boolean {
    return this.state !== "shutdown"
  }
}
