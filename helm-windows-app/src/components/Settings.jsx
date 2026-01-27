/**
 * Helm Control - Settings Component
 * System configuration and settings
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Alert,
  Paper,
  Grid,
  Divider,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const Settings = ({ onNotification }) => {
  const [settings, setSettings] = useState({
    // Server Settings
    helmPort: 3001,
    dashboardPort: 8082,
    autoStartOllama: true,
    
    // AI Settings
    defaultModel: 'phi',
    maxTokens: 500,
    timeout: 15000,
    
    // Learning Settings
    learningEnabled: true,
    learningPath: 'D:\\AceyLearning\\helm',
    qualityThreshold: 0.7,
    
    // UI Settings
    darkMode: true,
    autoRefresh: true,
    refreshInterval: 5000,
    
    // Security Settings
    enableAuth: false,
    sessionTimeout: 3600,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load settings from localStorage or API
      const savedSettings = localStorage.getItem('helm-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (err) {
      setError('Failed to load settings');
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // Save to localStorage
      localStorage.setItem('helm-settings', JSON.stringify(settings));
      
      // Here you would also save to backend API
      // await fetch('http://localhost:3001/settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });
      
      onNotification('success', 'Settings saved successfully');
      setLoading(false);
    } catch (err) {
      setError('Failed to save settings');
      setLoading(false);
    }
  };

  const resetSettings = () => {
    const defaultSettings = {
      helmPort: 3001,
      dashboardPort: 8082,
      autoStartOllama: true,
      defaultModel: 'phi',
      maxTokens: 500,
      timeout: 15000,
      learningEnabled: true,
      learningPath: 'D:\\AceyLearning\\helm',
      qualityThreshold: 0.7,
      darkMode: true,
      autoRefresh: true,
      refreshInterval: 5000,
      enableAuth: false,
      sessionTimeout: 3600,
    };
    setSettings(defaultSettings);
    onNotification('info', 'Settings reset to defaults');
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          ⚙️ Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={resetSettings}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveSettings}
            disabled={loading}
          >
            Save Settings
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Server Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🖥️ Server Settings
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Helm Port"
                  type="number"
                  value={settings.helmPort}
                  onChange={(e) => handleSettingChange('helmPort', parseInt(e.target.value))}
                  size="small"
                />
                <TextField
                  label="Dashboard Port"
                  type="number"
                  value={settings.dashboardPort}
                  onChange={(e) => handleSettingChange('dashboardPort', parseInt(e.target.value))}
                  size="small"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoStartOllama}
                      onChange={(e) => handleSettingChange('autoStartOllama', e.target.checked)}
                    />
                  }
                  label="Auto-start Ollama"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🤖 AI Settings
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Default Model</InputLabel>
                  <Select
                    value={settings.defaultModel}
                    label="Default Model"
                    onChange={(e) => handleSettingChange('defaultModel', e.target.value)}
                  >
                    <MenuItem value="tinyllama">TinyLlama</MenuItem>
                    <MenuItem value="phi">Phi</MenuItem>
                    <MenuItem value="qwen:0.5b">Qwen 0.5B</MenuItem>
                    <MenuItem value="deepseek-coder:1.3b">DeepSeek Coder</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Max Tokens"
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                  size="small"
                />
                <TextField
                  label="Timeout (ms)"
                  type="number"
                  value={settings.timeout}
                  onChange={(e) => handleSettingChange('timeout', parseInt(e.target.value))}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Learning Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🧠 Learning Settings
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.learningEnabled}
                      onChange={(e) => handleSettingChange('learningEnabled', e.target.checked)}
                    />
                  }
                  label="Enable Learning"
                />
                <TextField
                  label="Learning Path"
                  value={settings.learningPath}
                  onChange={(e) => handleSettingChange('learningPath', e.target.value)}
                  size="small"
                />
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Quality Threshold: {settings.qualityThreshold}
                  </Typography>
                  <Slider
                    value={settings.qualityThreshold}
                    onChange={(e, value) => handleSettingChange('qualityThreshold', value)}
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    marks={[
                      { value: 0.1, label: '0.1' },
                      { value: 0.5, label: '0.5' },
                      { value: 1.0, label: '1.0' }
                    ]}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* UI Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎨 UI Settings
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkMode}
                      onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                    />
                  }
                  label="Dark Mode"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoRefresh}
                      onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                    />
                  }
                  label="Auto Refresh"
                />
                <TextField
                  label="Refresh Interval (ms)"
                  type="number"
                  value={settings.refreshInterval}
                  onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                  size="small"
                  disabled={!settings.autoRefresh}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔐 Security Settings
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableAuth}
                      onChange={(e) => handleSettingChange('enableAuth', e.target.checked)}
                    />
                  }
                  label="Enable Authentication"
                />
                <TextField
                  label="Session Timeout (seconds)"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  size="small"
                  disabled={!settings.enableAuth}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
