/**
 * Helm Control - Enhanced Dashboard Component
 * Embeds the enhanced web dashboard with all features
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  LinearProgress,
  Button,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const EnhancedDashboard = ({ onNotification }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardUrl, setDashboardUrl] = useState('http://localhost:8082/helm-dashboard-complete.html');

  useEffect(() => {
    // Check if dashboard server is running
    checkDashboardStatus();
  }, []);

  const checkDashboardStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8082/helm-dashboard-complete.html', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      // If we get here, the server is responding
      setLoading(false);
    } catch (err) {
      setError('Dashboard server not running. Please start the dashboard server first.');
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    const iframe = document.getElementById('dashboard-frame');
    if (iframe) {
      iframe.src = iframe.src;
    }
    checkDashboardStatus();
  };

  const handleOpenInBrowser = () => {
    window.open(dashboardUrl, '_blank');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading Enhanced Dashboard...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="warning" 
          action={
            <Button color="inherit" size="small" onClick={checkDashboardStatus}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            To start the dashboard server, run:
          </Typography>
          <Paper sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
            <Typography variant="body2" component="pre" sx={{ m: 0 }}>
              cd acey-control-center
              python serve-dashboard.py
            </Typography>
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'background.paper'
      }}>
        <Typography variant="h6" component="div">
          🛡️ Helm Enhanced Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open in Browser">
            <IconButton onClick={handleOpenInBrowser} size="small">
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Dashboard iframe */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <iframe
          id="dashboard-frame"
          src={dashboardUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#1a1a2e'
          }}
          title="Helm Enhanced Dashboard"
          onLoad={() => setLoading(false)}
          onError={() => setError('Failed to load dashboard')}
        />
      </Box>

      {/* Status bar */}
      <Box sx={{ 
        borderTop: 1, 
        borderColor: 'divider',
        p: 1,
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="caption" color="text.secondary">
          🛡️ Helm AI System • Enhanced Interface • Real-time Learning Active
        </Typography>
        <Typography variant="caption" color="success.main">
          ● Connected
        </Typography>
      </Box>
    </Box>
  );
};

export default EnhancedDashboard;
