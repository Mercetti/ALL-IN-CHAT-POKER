/**
 * Helm Control - Skill Management Component
 * Manage AI skills and capabilities
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
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Assessment as AnalyticsIcon,
} from '@mui/icons-material';

const SkillManagement = ({ onNotification }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/helm/status');
      const data = await response.json();
      
      if (data.skills) {
        setSkills(data.skills.map(skill => ({
          name: skill,
          status: 'active',
          description: `AI skill: ${skill}`,
          lastUsed: new Date().toISOString()
        })));
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load skills from Helm server');
      setLoading(false);
    }
  };

  const executeSkill = async (skillName) => {
    try {
      const response = await fetch(`http://localhost:3001/helm/skill/${skillName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          params: {},
          sessionId: 'windows-app'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        onNotification('success', `Skill ${skillName} executed successfully`);
      } else {
        onNotification('error', `Skill ${skillName} failed: ${result.error}`);
      }
    } catch (err) {
      onNotification('error', `Failed to execute skill ${skillName}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading Skills...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadSkills}>
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
        🛠️ Skill Management
      </Typography>
      
      <Grid container spacing={3}>
        {skills.map((skill, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{skill.name}</Typography>
                  <Chip 
                    label={skill.status} 
                    color={skill.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {skill.description}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<StartIcon />}
                    onClick={() => executeSkill(skill.name)}
                  >
                    Execute
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AnalyticsIcon />}
                  >
                    Analytics
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          📊 Skill Statistics
        </Typography>
        <Typography variant="body2">
          Total Skills: {skills.length} | Active: {skills.filter(s => s.status === 'active').length}
        </Typography>
      </Paper>
    </Box>
  );
};

export default SkillManagement;
