import React, { useState, useEffect } from 'react';
import { createTheme, ThemeProvider, CssBaseline, Box, Typography, Button, Card, CardContent, Grid, Alert } from '@mui/material';
import { Dashboard as DashboardIcon, Chat as ChatIcon, Assessment as AnalyticsIcon, Settings as SettingsIcon } from '@mui/icons-material';

// Create dark theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#121212', paper: '#1e1e1e' },
  },
});

function SimpleApp() {
  const [helmConnected, setHelmConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentModel, setCurrentModel] = useState('tinyllama');

  useEffect(() => {
    // Try to connect to Helm
    const connectToHelm = async () => {
      try {
        if (window.helmAPI) {
          const connected = await window.helmAPI.connect();
          setHelmConnected(connected);
          if (connected) {
            addNotification('success', 'Connected to Helm with Small LLMs');
          } else {
            addNotification('warning', 'Helm not found - running in demo mode');
          }
        } else {
          // Fallback for development
          setTimeout(() => {
            setHelmConnected(true);
            addNotification('success', 'Demo mode - Small LLMs ready');
          }, 1000);
        }
      } catch (error) {
        addNotification('warning', 'Demo mode - Small LLMs simulated');
        setHelmConnected(true);
      }
    };

    connectToHelm();
  }, []);

  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const testSkill = async (skillId) => {
    addNotification('info', `Testing ${skillId} with ${currentModel}...`);
    // Simulate skill execution
    setTimeout(() => {
      addNotification('success', `${skillId} completed successfully`);
    }, 2000);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom>
            🛡️ Helm Control - Small LLM Edition
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Advanced AI with Minimal Resources
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1">
              Status: {helmConnected ? '🟢 Connected' : '🔴 Connecting...'}
            </Typography>
            <Typography variant="body2">
              Current Model: {currentModel}
            </Typography>
          </Box>
        </Box>

        {/* Notifications */}
        {notifications.map((notification) => (
          <Alert
            key={notification.id}
            severity={notification.type}
            sx={{ mb: 2 }}
            onClose={() => {
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }}
          >
            {notification.message}
          </Alert>
        ))}

        {/* Model Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              🤖 Small LLM Models
            </Typography>
            <Grid container spacing={2}>
              {[
                { name: 'tinyllama', size: '637MB', speed: 'Fastest' },
                { name: 'phi', size: '1.6GB', speed: 'Balanced' },
                { name: 'qwen:0.5b', size: '394MB', speed: 'Efficient' },
                { name: 'deepseek-coder:1.3b', size: '776MB', speed: 'Coding' }
              ].map((model) => (
                <Grid item xs={6} sm={3} key={model.name}>
                  <Button
                    variant={currentModel === model.name ? 'contained' : 'outlined'}
                    fullWidth
                    onClick={() => setCurrentModel(model.name)}
                    sx={{ height: '80px', flexDirection: 'column' }}
                  >
                    <Typography variant="caption">{model.name}</Typography>
                    <Typography variant="caption" display="block">{model.size}</Typography>
                    <Typography variant="caption" display="block">{model.speed}</Typography>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* AI Skills */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              🎮 AI Skills
            </Typography>
            <Grid container spacing={2}>
              {[
                { id: 'quick_commentary', name: 'Quick Commentary', icon: '💬' },
                { id: 'simple_chat', name: 'Simple Chat', icon: '💭' },
                { id: 'basic_analysis', name: 'Game Analysis', icon: '📊' },
                { id: 'quick_assist', name: 'Player Assist', icon: '🤝' },
                { id: 'code_analysis', name: 'Code Analysis', icon: '💻' },
                { id: 'poker_deal', name: 'Poker Deal', icon: '🃏' }
              ].map((skill) => (
                <Grid item xs={12} sm={6} md={4} key={skill.id}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => testSkill(skill.id)}
                    sx={{ p: 2, height: '80px' }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4">{skill.icon}</Typography>
                      <Typography variant="body2">{skill.name}</Typography>
                    </Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              📈 System Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">Total Models: 4</Typography>
                <Typography variant="body2">Total Storage: ~3.4GB</Typography>
                <Typography variant="body2">Response Time: 1-3 seconds</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">Privacy: 100% Local</Typography>
                <Typography variant="body2">Cost: $0 Forever</Typography>
                <Typography variant="body2">AI Type: Small Language Models</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}

export default SimpleApp;
