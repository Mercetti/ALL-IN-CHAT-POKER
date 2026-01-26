import React, { useState, useEffect } from 'react';
import { createTheme, ThemeProvider, CssBaseline, Box, Typography, Button, Card, CardContent, Grid, Alert, TextField } from '@mui/material';
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
    const id = Date.now() + Math.random(); // Ensure unique ID
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [codeInput, setCodeInput] = useState('');
  const [codeAnalysis, setCodeAnalysis] = useState('');
  const [creativeInput, setCreativeInput] = useState('');
  const [creativeOutput, setCreativeOutput] = useState('');

  const executeSkill = async (skillId, params = {}) => {
    addNotification('info', `Executing ${skillId} with ${currentModel}...`);
    
    try {
      if (window.helmAPI && window.helmAPI.executeSkill) {
        const result = await window.helmAPI.executeSkill(skillId, {
          ...params,
          model: currentModel,
          sessionId: 'windows-app'
        });
        
        if (result.success) {
          addNotification('success', `${skillId} completed successfully`);
          return result.result;
        } else {
          addNotification('error', `${skillId} failed: ${result.error || 'Unknown error'}`);
          return null;
        }
      } else {
        addNotification('warning', `Helm not available - using demo mode`);
        return null;
      }
    } catch (error) {
      addNotification('error', `${skillId} error: ${error.message}`);
      return null;
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatInput('');
    
    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Get AI response
    const result = await executeSkill('simple_chat', { message: userMessage });
    
    if (result) {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: result.response || result.commentary || 'I processed your message.' 
      }]);
    }
  };

  const analyzeCode = async () => {
    if (!codeInput.trim()) return;
    
    addNotification('info', 'Analyzing code with DeepSeek-Coder...');
    
    const result = await executeSkill('code_analysis', { 
      code: codeInput,
      language: 'javascript',
      task: 'analyze'
    });
    
    if (result) {
      setCodeAnalysis(result.analysis || 'Code analysis completed.');
    }
  };

  const createContent = async () => {
    if (!creativeInput.trim()) return;
    
    addNotification('info', 'Creating content with AI...');
    
    const result = await executeSkill('create_content', { 
      type: 'logo',
      description: creativeInput,
      style: 'modern',
      format: 'detailed'
    });
    
    if (result) {
      setCreativeOutput(result.content || 'Content created successfully.');
    }
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

        {/* AI Chat Interface */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              💬 AI Chat Assistant
            </Typography>
            <Box sx={{ mb: 2, maxHeight: '300px', overflow: 'auto', bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
              {chatHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Start a conversation with your AI assistant...
                </Typography>
              ) : (
                chatHistory.map((msg, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2" color={msg.role === 'user' ? 'primary' : 'secondary'}>
                      <strong>{msg.role === 'user' ? 'You:' : 'AI:'}</strong> {msg.content}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask your AI assistant anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChat()}
              />
              <Button variant="contained" onClick={handleChat}>
                Send
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Code Analysis */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              💻 Code Analysis (DeepSeek-Coder)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Paste your code here for analysis..."
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" onClick={analyzeCode} sx={{ mb: 2 }}>
              Analyze Code
            </Button>
            {codeAnalysis && (
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" component="pre">
                  {codeAnalysis}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Creative Content */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              🎨 Creative Content (Logo Design)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="Describe what you want to create (e.g., 'a modern logo for an AI company called Helm')..."
              value={creativeInput}
              onChange={(e) => setCreativeInput(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" onClick={createContent} sx={{ mb: 2 }}>
              Create Content
            </Button>
            {creativeOutput && (
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" component="pre">
                  {creativeOutput}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              ⚡ Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {[
                { id: 'quick_commentary', name: 'Poker Commentary', icon: '�' },
                { id: 'basic_analysis', name: 'Game Analysis', icon: '📊' },
                { id: 'quick_assist', name: 'Player Help', icon: '🤝' },
                { id: 'poker_deal', name: 'Smart Deal', icon: '🃏' }
              ].map((action) => (
                <Grid item xs={12} sm={6} md={3} key={action.id}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => executeSkill(action.id)}
                    sx={{ p: 2, height: '80px' }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4">{action.icon}</Typography>
                      <Typography variant="body2">{action.name}</Typography>
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
