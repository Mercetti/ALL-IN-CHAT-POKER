/**
 * Helm Control - Monitor Logs Component
 * View system logs and monitoring data
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const MonitorLogs = ({ onNotification }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logLevel, setLogLevel] = useState('all');

  useEffect(() => {
    loadLogs();
  }, [logLevel]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      // Mock log data for now
      const mockLogs = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Helm server started successfully',
          source: 'helm-server'
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'success',
          message: 'Learning system initialized',
          source: 'helm-engine'
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'warning',
          message: 'Dashboard feature detection incomplete',
          source: 'test-suite'
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: 'info',
          message: 'Ollama models loaded successfully',
          source: 'ollama'
        },
        {
          id: 5,
          timestamp: new Date(Date.now() - 240000).toISOString(),
          level: 'error',
          message: 'Failed to connect to external service',
          source: 'api-gateway'
        }
      ];
      
      const filteredLogs = logLevel === 'all' ? mockLogs : mockLogs.filter(log => log.level === logLevel);
      setLogs(filteredLogs);
      setLoading(false);
    } catch (err) {
      setError('Failed to load logs');
      setLoading(false);
    }
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'success': return <CheckCircleIcon color="success" />;
      case 'info': return <InfoIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message} (${log.source})`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helm-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    onNotification('success', 'Logs exported successfully');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading Logs...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadLogs}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          📊 System Logs
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Level</InputLabel>
            <Select
              value={logLevel}
              label="Level"
              onChange={(e) => setLogLevel(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="info">Info</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadLogs}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportLogs}
          >
            Export
          </Button>
        </Box>
      </Box>
      
      <Card>
        <CardContent sx={{ p: 0 }}>
          <List sx={{ maxHeight: 600, overflow: 'auto' }}>
            {logs.map((log) => (
              <ListItem key={log.id} divider>
                <ListItemIcon>
                  {getLogIcon(log.level)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {log.message}
                      </Typography>
                      <Chip 
                        label={log.level} 
                        color={getLogColor(log.level)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {new Date(log.timestamp).toLocaleString()} • {log.source}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
      
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          📈 Log Statistics
        </Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Typography variant="body2">
            Total: {logs.length}
          </Typography>
          <Typography variant="body2" color="error.main">
            Errors: {logs.filter(l => l.level === 'error').length}
          </Typography>
          <Typography variant="body2" color="warning.main">
            Warnings: {logs.filter(l => l.level === 'warning').length}
          </Typography>
          <Typography variant="body2" color="success.main">
            Success: {logs.filter(l => l.level === 'success').length}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default MonitorLogs;
