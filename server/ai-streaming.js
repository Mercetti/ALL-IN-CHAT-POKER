/**
 * AI Streaming Response System
 * Enables real-time token-by-token AI responses
 */

const EventEmitter = require('events');
const Logger = require('./logger');

const logger = new Logger('ai-streaming');

class AIStreaming extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxTokens = options.maxTokens || 30;
    this.streamTimeout = options.streamTimeout || 10000;
    this.activeStreams = new Map();
  }

  /**
   * Stream AI response token by token
   */
  async *streamResponse(messages = [], options = {}) {
    const streamId = this.generateStreamId();
    const startTime = Date.now();
    
    try {
      // For now, simulate streaming with chunks
      // In real implementation, this would use Ollama's streaming API
      const fullResponse = await this.getFullResponse(messages, options);
      const chunks = this.chunkResponse(fullResponse);
      
      this.activeStreams.set(streamId, {
        startTime,
        chunksGenerated: 0,
        totalChunks: chunks.length
      });
      
      for (const chunk of chunks) {
        // Emit chunk
        yield {
          id: streamId,
          chunk,
          isComplete: false,
          timestamp: Date.now()
        };
        
        // Update stream stats
        const stream = this.activeStreams.get(streamId);
        if (stream) {
          stream.chunksGenerated++;
          stream.lastChunkTime = Date.now();
        }
        
        // Small delay to simulate real streaming
        await this.delay(50);
      }
      
      // Final completion signal
      yield {
        id: streamId,
        chunk: '',
        isComplete: true,
        timestamp: Date.now(),
        fullResponse
      };
      
      // Clean up
      this.activeStreams.delete(streamId);
      
    } catch (error) {
      this.activeStreams.delete(streamId);
      throw error;
    }
  }

  /**
   * Get full response (for now, uses existing AI system)
   */
  async getFullResponse(messages = [], options = {}) {
    const { chat } = require('./ai');
    return await chat(messages, options);
  }

  /**
   * Chunk response into smaller pieces
   */
  chunkResponse(response, chunkSize = 3) {
    const words = response.split(' ');
    const chunks = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    
    return chunks.length > 0 ? chunks : [''];
  }

  /**
   * Create SSE response for HTTP streaming
   */
  createSSEResponse(streamGenerator, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    const processStream = async () => {
      try {
        for await (const chunk of streamGenerator) {
          const eventData = `data: ${JSON.stringify(chunk)}\n\n`;
          res.write(eventData);
          
          if (chunk.isComplete) {
            res.write('event: complete\ndata: stream-ended\n\n');
            res.end();
            break;
          }
        }
      } catch (error) {
        const errorData = `event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`;
        res.write(errorData);
        res.end();
      }
    };
    
    processStream();
    
    // Handle client disconnect
    res.on('close', () => {
      logger.debug('SSE client disconnected');
  }

  /**
   * Generate unique stream ID
   */
  generateStreamId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Simple delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get active streams info
   */
  getActiveStreams() {
    return Array.from(this.activeStreams.entries()).map(([id, info]) => ({
      id,
      ...info,
      duration: Date.now() - info.startTime
    }));
  }

  /**
   * Cancel active stream
   */
  cancelStream(streamId) {
    if (this.activeStreams.has(streamId)) {
      this.activeStreams.delete(streamId);
      logger.info('Stream cancelled', { streamId });
      return true;
    }
    return false;
  }
}

module.exports = AIStreaming;
