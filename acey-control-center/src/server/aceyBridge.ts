import { io, Socket } from 'socket.io-client';
import { AceyOutput } from '../contracts/output';
import { applyAutoRules } from './autoRules';

export interface AceyBridgeConfig {
  controlCenterUrl: string;
  aceySystemUrl: string;
  autoRulesEnabled: boolean;
  dryRunMode: boolean;
}

export class AceyBridge {
  private controlCenterSocket: Socket | null = null;
  private aceySocket: Socket | null = null;
  private config: AceyBridgeConfig;
  private isConnected = false;

  constructor(config: AceyBridgeConfig) {
    this.config = config;
  }

  // Connect to both systems
  async connect(): Promise<void> {
    try {
      // Connect to AI Control Center
      this.controlCenterSocket = io(this.config.controlCenterUrl);
      
      this.controlCenterSocket.on('connect', () => {
        console.log('✅ Connected to AI Control Center');
        this.checkConnectionStatus();
      });

      this.controlCenterSocket.on('disconnect', () => {
        console.log('❌ Disconnected from AI Control Center');
        this.isConnected = false;
      });

      // Connect to existing Acey system
      this.aceySocket = io(this.config.aceySystemUrl);
      
      this.aceySocket.on('connect', () => {
        console.log('✅ Connected to Acey System');
        this.checkConnectionStatus();
      });

      this.aceySocket.on('disconnect', () => {
        console.log('❌ Disconnected from Acey System');
        this.isConnected = false;
      });

      // Listen for Acey output
      this.aceySocket.on('acey_output', this.handleAceyOutput.bind(this));

      // Listen for Control Center commands
      this.controlCenterSocket.on('control_command', this.handleControlCommand.bind(this));

      console.log('🔗 Initializing Acey Bridge connections...');

    } catch (error) {
      console.error('❌ Failed to initialize bridge:', error);
      throw error;
    }
  }

  // Check if both systems are connected
  private checkConnectionStatus(): void {
    if (this.controlCenterSocket?.connected && this.aceySocket?.connected) {
      this.isConnected = true;
      console.log('🎯 Bridge fully connected - Acey ↔ Control Center');
      this.emitBridgeStatus('connected');
    }
  }

  // Handle incoming Acey output
  private async handleAceyOutput(data: any): Promise<void> {
    try {
      console.log('📤 Received Acey output:', data);

      // Apply auto-rules if enabled
      let processedData = data;
      if (this.config.autoRulesEnabled) {
        const ruleResults = applyAutoRules(data, {
          memory: { lowConfidence: true, ttlLimit: true, duplicateCheck: true },
          persona: { lockCheck: true, frequencyLimit: true },
          trust: { deltaThrottle: true, boundsCheck: true },
          moderation: { severityFilter: true, frequencyLimit: true }
        });

        // Apply rule results to the data
        if (ruleResults.action === 'reject' || ruleResults.action === 'deny') {
          console.log('🚫 Auto-rule rejected/denied intent:', ruleResults.reason);
          // Send rejection back to Acey
          if (this.aceySocket?.connected) {
            this.aceySocket.emit('output_processed', {
              success: false,
              error: ruleResults.reason || 'Auto-rule rejection'
            });
          }
          return;
        }

        if (ruleResults.modifiedIntent) {
          // Replace the modified intent in the data
          const intentIndex = processedData.intents.findIndex(
            (intent: any) => intent.type === ruleResults.modifiedIntent?.type
          );
          if (intentIndex >= 0) {
            processedData.intents[intentIndex] = ruleResults.modifiedIntent;
          }
        }
        
        // Log rule applications
        if (ruleResults.reason) {
          console.log('🔧 Auto-rule applied:', ruleResults.reason);
        }
      }

      // Forward to Control Center for processing
      if (this.controlCenterSocket?.connected) {
        this.controlCenterSocket.emit('acey_output', processedData);
      }

      // Send back to Acey with any modifications
      if (this.aceySocket?.connected) {
        this.aceySocket.emit('output_processed', {
          success: true,
          processed: processedData.intents.length,
          modified: JSON.stringify(data) !== JSON.stringify(processedData)
        });
      }

    } catch (error) {
      console.error('❌ Error processing Acey output:', error);
      
      // Send error back to Acey
      if (this.aceySocket?.connected) {
        this.aceySocket.emit('output_processed', {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // Handle Control Center commands
  private handleControlCommand(command: any): void {
    try {
      console.log('🎮 Received Control Center command:', command);

      switch (command.type) {
        case 'update_config':
          this.updateConfig(command.config);
          break;
        
        case 'emergency_stop':
          this.handleEmergencyStop();
          break;
        
        case 'get_status':
          this.emitBridgeStatus('status_request');
          break;
        
        default:
          console.log('⚠️ Unknown command type:', command.type);
      }

    } catch (error) {
      console.error('❌ Error handling control command:', error);
    }
  }

  // Update bridge configuration
  private updateConfig(newConfig: Partial<AceyBridgeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Bridge configuration updated:', this.config);
    this.emitBridgeStatus('config_updated');
  }

  // Handle emergency stop
  private handleEmergencyStop(): void {
    console.log('🚨 Emergency stop activated - pausing all Acey outputs');
    
    if (this.aceySocket?.connected) {
      this.aceySocket.emit('pause_outputs');
    }
    
    this.emitBridgeStatus('emergency_stop');
  }

  // Emit bridge status
  private emitBridgeStatus(reason: string): void {
    const status = {
      timestamp: Date.now(),
      reason,
      connected: this.isConnected,
      config: this.config,
      connections: {
        controlCenter: this.controlCenterSocket?.connected || false,
        acey: this.aceySocket?.connected || false
      }
    };

    if (this.controlCenterSocket?.connected) {
      this.controlCenterSocket.emit('bridge_status', status);
    }
  }

  // Send test data through the bridge
  sendTestData(data: Partial<AceyOutput>): void {
    if (!this.isConnected) {
      console.error('❌ Bridge not fully connected');
      return;
    }

    const testData: AceyOutput = {
      speech: data.speech || "Test message from bridge",
      intents: data.intents || []
    };

    console.log('🧪 Sending test data through bridge:', testData);
    this.handleAceyOutput(testData);
  }

  // Get current status
  getStatus(): any {
    return {
      connected: this.isConnected,
      config: this.config,
      connections: {
        controlCenter: this.controlCenterSocket?.connected || false,
        acey: this.aceySocket?.connected || false
      }
    };
  }

  // Disconnect from both systems
  disconnect(): void {
    console.log('🔌 Disconnecting Acey Bridge...');
    
    if (this.controlCenterSocket) {
      this.controlCenterSocket.disconnect();
      this.controlCenterSocket = null;
    }
    
    if (this.aceySocket) {
      this.aceySocket.disconnect();
      this.aceySocket = null;
    }
    
    this.isConnected = false;
    console.log('✅ Acey Bridge disconnected');
  }
}
