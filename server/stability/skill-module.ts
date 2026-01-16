/**
 * Base Skill Module Interface
 * Defines the contract for all Acey skills
 */

export interface SkillModule {
  name: string;
  version: string;
  description: string;

  // Lifecycle methods
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  forceStop(): Promise<void>;

  // Status methods
  isHealthy(): boolean;
  isLLMConnected(): boolean;
  isCritical(): boolean;

  // Configuration methods
  getRequiredTier(): string;
  getDescription(): string;

  // Output methods
  getOutputById(outputId: string): any;
  getPendingOutputs(): Array<{id: string, timestamp: number, content: any}>;
  clearOutputs(): void;

  // Resource methods
  throttle(): Promise<void>;
  getUptime(): number;
  getLastError(): string | undefined;

  // State methods
  getState(): any;
  setState(state: any): void;
}

export abstract class BaseSkill implements SkillModule {
  public name: string;
  public version: string;
  public description: string;
  
  protected startTime: number = 0;
  protected outputs: Map<string, any> = new Map();
  protected lastError: string | undefined;
  protected state: any = {};

  constructor(name: string, version: string, description: string) {
    this.name = name;
    this.version = version;
    this.description = description;
  }

  // Default implementations
  async start(): Promise<void> {
    if (this.startTime > 0) {
      console.warn(`Skill ${this.name} already started`);
      return;
    }

    this.startTime = Date.now();
    this.lastError = undefined;
    console.log(`Skill ${this.name} started`);
  }

  async stop(): Promise<void> {
    if (this.startTime === 0) {
      console.warn(`Skill ${this.name} not running`);
      return;
    }

    this.startTime = 0;
    console.log(`Skill ${this.name} stopped`);
  }

  async restart(): Promise<void> {
    console.log(`Skill ${this.name} restarting...`);
    await this.stop();
    await this.start();
  }

  async forceStop(): Promise<void> {
    console.log(`Skill ${this.name} force stopping...`);
    this.startTime = 0;
    this.lastError = 'Force stopped';
  }

  isHealthy(): boolean {
    // Basic health check - can be overridden by subclasses
    return this.startTime > 0 && !this.lastError;
  }

  isLLMConnected(): boolean {
    // Default implementation - can be overridden
    return false;
  }

  isCritical(): boolean {
    // Default implementation - can be overridden
    return false;
  }

  getRequiredTier(): string {
    // Default implementation - can be overridden
    return 'Free';
  }

  getDescription(): string {
    return this.description;
  }

  getOutputById(outputId: string): any {
    return this.outputs.get(outputId);
  }

  getPendingOutputs(): Array<{id: string, timestamp: number, content: any}> {
    return Array.from(this.outputs.entries()).map(([id, content]) => ({
      id,
      timestamp: Date.now(),
      content
    }));
  }

  clearOutputs(): void {
    this.outputs.clear();
  }

  async throttle(): Promise<void> {
    console.log(`Skill ${this.name} throttled`);
    // Default implementation - can be overridden
  }

  getUptime(): number {
    return this.startTime > 0 ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
  }

  getLastError(): string | undefined {
    return this.lastError;
  }

  getState(): any {
    return this.state;
  }

  setState(state: any): void {
    this.state = { ...this.state, ...state };
  }

  // Utility methods
  protected addOutput(id: string, content: any): void {
    this.outputs.set(id, content);
  }

  protected removeOutput(id: string): void {
    this.outputs.delete(id);
  }

  protected getOutputCount(): number {
    return this.outputs.size;
  }
}

// Example skill implementations
export class CodeSkill extends BaseSkill {
  constructor() {
    super('CodeHelper', '1.0.0', 'AI-powered code generation and assistance');
  }

  isLLMConnected(): boolean {
    return true; // Code skill typically uses LLM
  }

  isCritical(): boolean {
    return true; // Code generation is critical for operations
  }
}

export class AudioSkill extends BaseSkill {
  constructor() {
    super('AudioProcessor', '1.0.0', 'Audio generation and processing capabilities');
  }

  isLLMConnected(): boolean {
    return true; // Audio skill typically uses LLM
  }

  isCritical(): boolean {
    return false; // Audio processing is non-critical
  }
}

export class FinancialSkill extends BaseSkill {
  constructor() {
    super('FinancialOps', '1.0.0', 'Financial operations and calculations');
  }

  isLLMConnected(): boolean {
    return false; // Financial ops typically don't need LLM
  }

  isCritical(): boolean {
    return true; // Financial operations are critical
  }
}
