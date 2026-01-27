/**
 * Helm Control - Session Control Component
 * Manage user sessions and authentication
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
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Timer as TimerIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const SessionControl = ({ onNotification }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      // Mock session data for now
      const mockSessions = [
        {
          id: 'default',
          user: 'System User',
          startTime: new Date(Date.now() - 3600000).toISOString(),
          lastActivity: new Date().toISOString(),
          skillsUsed: 5,
          status: 'active'
        },
        {
          id: 'windows-app',
          user: 'Windows App',
          startTime: new Date(Date.now() - 1800000).toISOString(),
          lastActivity: new Date().toISOString(),
          skillsUsed: 3,
          status: 'active'
        }
      ];
      
      setSessions(mockSessions);
      setLoading(false);
    } catch (err) {
      setError('Failed to load sessions');
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      // Mock session termination
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      onNotification('success', `Session ${sessionId} terminated`);
    } catch (err) {
      onNotification('error', 'Failed to terminate session');
    }
  };

  const formatDuration = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now - start;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading Sessions...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadSessions}>
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
      <Typography variant="h4" gutterBottom>
        🔐 Session Control
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Active Sessions
          </Typography>
          
          {sessions.map((session) => (
            <Card key={session.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonIcon />
                    <Box>
                      <Typography variant="h6">{session.user}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {session.id}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={session.status} 
                    color={session.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimerIcon fontSize="small" />
                    <Typography variant="body2">
                      Duration: {formatDuration(session.startTime)}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    Skills Used: {session.skillsUsed}
                  </Typography>
                </Box>
                
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => terminateSession(session.id)}
                >
                  Terminate Session
                </Button>
              </CardContent>
            </Card>
          ))}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              📊 Session Statistics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText 
                  primary="Active Sessions" 
                  secondary={sessions.length} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><SecurityIcon /></ListItemIcon>
                <ListItemText 
                  primary="Security Level" 
                  secondary="High" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><TimerIcon /></ListItemIcon>
                <ListItemText 
                  primary="Avg Session Duration" 
                  secondary="1h 30m" 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SessionControl;
