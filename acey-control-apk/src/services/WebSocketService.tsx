/**
 * WebSocket Service
 * Handles real-time communication with backend
 */

import React, { useEffect, useRef, useCallback } from 'react';

// Types
type WebSocketEvent = 
  | { type: 'connected'; data: { timestamp: string } }
  | { type: 'disconnected'; data: { code: number; reason: string; timestamp: string } }
  | { type: 'message'; data: any }
  | { type: 'error'; data: { error: string } };

type WebSocketCallback = (event: WebSocketEvent) => void;

class WebSocketService {
  private static instance: WebSocket | null = null;
  private static callbacks = new Set<WebSocketCallback>();
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static reconnectDelay = 1000; // Start with 1 second
  private static maxReconnectDelay = 30000; // Max 30 seconds

  static connect(url: string) {
    try {
      this.instance = new WebSocket(url);
      this.setupEventListeners();
      console.log('WebSocket connecting to:', url);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.notifyCallbacks('error', { error: 'Failed to create WebSocket connection' });
    }
  }

  static setupEventListeners() {
    if (!this.instance) return;

    if (this.instance.onopen) {
      this.instance.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.notifyCallbacks('connected', { timestamp: new Date().toISOString() });
      };
    }

    if (this.instance.onmessage) {
      this.instance.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyCallbacks('message', data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          this.notifyCallbacks('error', { error: 'Failed to parse message' });
        }
      };
    }

    if (this.instance.onclose) {
      this.instance.onclose = (event: CloseEvent) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.notifyCallbacks('disconnected', { 
          code: event.code, 
          reason: event.reason,
          timestamp: new Date().toISOString()
        });
        
        // Attempt reconnection if not a clean close
        if (event.code !== 1000) {
          this.attemptReconnection();
        }
      };
    }

    if (this.instance.onerror) {
      this.instance.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
        this.notifyCallbacks('error', { error: 'WebSocket connection error' });
      };
    }
  }

  static attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.notifyCallbacks('error', { error: 'Max reconnection attempts reached' });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      const url = this.instance?.url;
      if (url) {
        this.connect(url);
      }
    }, delay);
  }

  static send(data: any) {
    if (this.instance && this.instance.readyState === WebSocket.OPEN) {
      try {
        this.instance.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    } else {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }
  }

  static subscribe(callback: WebSocketCallback) {
    this.callbacks.add(callback);
    return () => this.unsubscribe(callback);
  }

  static unsubscribe(callback: WebSocketCallback) {
    this.callbacks.delete(callback);
  }

  static notifyCallbacks(event: WebSocketEvent['type'], data: any) {
    this.callbacks.forEach(callback => {
      try {
        callback({ type: event, data } as WebSocketEvent);
      } catch (error) {
        console.error('Error in WebSocket callback:', error);
      }
    });
  }

  static disconnect() {
    if (this.instance) {
      this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
      this.instance.close(1000, 'Manual disconnect');
      this.instance = null;
    }
  }

  static getConnectionState() {
    if (!this.instance) return 'disconnected';
    
    switch (this.instance.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  static isConnected() {
    return this.getConnectionState() === 'connected';
  }
}

// React Hook for WebSocket
export function useWebSocket(url: string) {
  const [connectionState, setConnectionState] = React.useState('disconnected');
  const [lastMessage, setLastMessage] = React.useState<any>(null);
  const callbacksRef = useRef(new Set<WebSocketCallback>());

  const handleMessage = useCallback((event: WebSocketEvent) => {
    switch (event.type) {
      case 'connected':
        setConnectionState('connected');
        break;
      case 'disconnected':
        setConnectionState('disconnected');
        break;
      case 'message':
        setLastMessage(event.data);
        break;
      case 'error':
        console.error('WebSocket error:', event.data);
        break;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = WebSocketService.subscribe(handleMessage);
    
    WebSocketService.connect(url);

    return () => {
      unsubscribe();
      WebSocketService.disconnect();
    };
  }, [url, handleMessage]);

  const sendMessage = useCallback((data: any) => {
    return WebSocketService.send(data);
  }, []);

  return {
    connectionState,
    lastMessage,
    sendMessage,
    isConnected: WebSocketService.isConnected(),
  };
}

export default WebSocketService;
