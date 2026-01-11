const { buildSchema } = require('graphql');
const express = require('express');
const app = express();

function validateEndpoints(app, endpoints) {
  const requiredEndpoints = endpoints;

  requiredEndpoints.forEach(endpoint => {
    if (endpoint.methods.includes('WEBSOCKET')) {
      // Special handling for WebSocket endpoints
      const wsHandler = app._router.stack.find(layer => 
        layer.handle.name === 'handleUpgrade'
      );
      if (!wsHandler) {
        throw new Error(`WebSocket not configured for ${endpoint.path}`);
      }
    } else {
      const route = app._router.stack.find(layer => 
        layer.route && layer.route.path === endpoint.path
      );
      if (!route) {
        throw new Error(`Endpoint ${endpoint.path} not registered`);
      }
      
      const methods = Object.keys(route.route.methods).map(m => m.toUpperCase());
      endpoint.methods.forEach(m => {
        if (!methods.includes(m)) {
          throw new Error(`Method ${m} missing on ${endpoint.path}`);
        }
      });
    }
  });
}

module.exports = validateEndpoints;
