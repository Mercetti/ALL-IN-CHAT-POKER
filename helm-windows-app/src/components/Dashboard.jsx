/**
 * Helm Control - Dashboard Component
 * Real-time system monitoring and control
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Casino as CasinoIcon,
  Assessment as AnalyticsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const Dashboard = ({ onNotification }) => {
  const [helmStatus, setHelmStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const status = await window.helmAPI.getStatus();
      setHelmStatus(status);
      
      // Load recent activity
      const auditLog = await window.helmAPI.getAuditLog();
      const recent = auditLog.auditLog.slice(-5).reverse();
      setRecentActivity(recent);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleStartAll = async () => {
    setLoading(true);
    try {
      const result = await window.helmAPI.executeSkill('system_start');
      onNotification('success', 'All AI services started successfully');
      await loadDashboardData();
    } catch (error) {
      onNotification('error', `Failed to start services: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStopAll = async () => {
    setLoading(true);
    try {
      const result = await window.helmAPI.executeSkill('system_stop');
      onNotification('warning', 'All AI services stopped');
      await loadDashboardData();
    } catch (error) {
      onNotification('error', `Failed to stop services: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyShutdown = async () => {
    setLoading(true);
    try {
      const result = await window.helmAPI.executeSkill('emergency_shutdown');
      onNotification('error', 'Emergency shutdown completed - Critical data preserved');
      await loadDashboardData();
    } catch (error) {
      onNotification('error', `Emergency shutdown failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'success';
      case 'stopped': return 'error';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  const getActivityIcon = (event) => {
    switch (event) {
      case 'skill_start': return <PlayArrowIcon />;
      case 'skill_complete': return <CheckCircleIcon />;
      case 'skill_error': return <WarningIcon />;
      default: return <AnalyticsIcon />;
    }
  };

  if (!helmStatus) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🛡️ Helm Control Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Real-time monitoring and control of AI systems
      </Typography>

      {/* Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">System Status</Typography>
              </Box>
              <Chip 
                label={helmStatus.running ? 'Online' : 'Offline'}
                color={helmStatus.running ? 'success' : 'error'}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Uptime: {Math.floor(helmStatus.uptime / 60)}m {Math.floor(helmStatus.uptime % 60)}s
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MemoryIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Memory Usage</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {Math.round(helmStatus.memory?.heapUsed / 1024 / 1024 || 0)}MB
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(helmStatus.memory?.heapUsed / helmStatus.memory?.heapTotal * 100) || 0}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                of {Math.round(helmStatus.memory?.heapTotal / 1024 / 1024 || 0)}MB allocated
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Active Sessions</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {helmStatus.sessions || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current user sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">Skills Executed</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {helmStatus.metrics?.totalExecutions || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total skill executions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Control Panel */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Control Panel
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<StartIcon />}
            onClick={handleStartAll}
            disabled={loading || helmStatus.running}
          >
            Start All Services
          </Button>
          
          <Button
            variant="outlined"
            color="warning"
            startIcon={<StopIcon />}
            onClick={handleStopAll}
            disabled={loading || !helmStatus.running}
          >
            Stop All Services
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<WarningIcon />}
            onClick={handleEmergencyShutdown}
            disabled={loading || !helmStatus.running}
          >
            Emergency Shutdown
          </Button>
        </Box>

        {loading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Processing command...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Skills Status */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Available Skills
            </Typography>
            
            <List dense>
              {helmStatus.skills?.map((skill) => (
                <ListItem key={skill}>
                  <ListItemIcon>
                    <CasinoIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={skill}
                    secondary="Ready for execution"
                  />
                  <Chip label="Active" size="small" color="success" />
                </ListItem>
              )) || (
                <ListItem>
                  <ListItemText primary="No skills available" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            
            <List dense>
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        {getActivityIcon(activity.event)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={activity.data?.skillId || activity.event}
                        secondary={new Date(activity.timestamp).toLocaleTimeString()}
                      />
                      <Chip 
                        label={activity.event} 
                        size="small" 
                        color={getStatusColor(activity.event)}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No recent activity" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* System Health Alert */}
      {!helmStatus.running && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Helm Engine is currently offline. Some features may not be available.
        </Alert>
      )}

      {helmStatus.running && (
        <Alert severity="success">
          Helm Engine is running normally. All systems operational.
        </Alert>
      )}
    </Box>
  );
};

export default Dashboard;
