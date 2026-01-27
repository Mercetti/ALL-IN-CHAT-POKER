/**
 * Helm Control Windows App - Main React Application
 * Professional AI Control Center Interface
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, AppBar, Toolbar, Typography, IconButton, Badge, Alert } from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Assessment as AnalyticsIcon,
  Chat as ChatIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

// Import components
import EnhancedDashboard from './components/EnhancedDashboard';
import Dashboard from './components/Dashboard';
import SkillManagement from './components/SkillManagement';
import SessionControl from './components/SessionControl';
import MonitorLogs from './components/MonitorLogs';
import Settings from './components/Settings';

// Create dark theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [helmConnected, setHelmConnected] = useState(false);
  const [helmStatus, setHelmStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Initialize Helm connection
  useEffect(() => {
    const initializeHelm = async () => {
      try {
        const connected = await window.helmAPI.connect();
        setHelmConnected(connected);
        
        if (connected) {
          const status = await window.helmAPI.getStatus();
          setHelmStatus(status);
        }
      } catch (error) {
        console.error('Failed to initialize Helm:', error);
        addNotification('error', 'Failed to connect to Helm Engine');
      }
    };

    initializeHelm();

    // Set up event listeners
    window.helmEvents.onStatusChanged((status) => {
      setHelmConnected(status);
    });

    window.helmEvents.onNotification((notification) => {
      addNotification(notification.type, notification.message);
    });

    return () => {
      window.helmEvents.removeAllListeners();
    };
  }, []);

  // Add notification
  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Navigation items
  const navigationItems = [
    { id: 'dashboard', label: 'Enhanced Dashboard', icon: <DashboardIcon />, component: EnhancedDashboard },
    { id: 'classic', label: 'Classic Dashboard', icon: <AnalyticsIcon />, component: Dashboard },
    { id: 'skills', label: 'Skills', icon: <ChatIcon />, component: SkillManagement },
    { id: 'sessions', label: 'Sessions', icon: <SecurityIcon />, component: SessionControl },
    { id: 'logs', label: 'Logs', icon: <AnalyticsIcon />, component: MonitorLogs },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon />, component: Settings },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router future={{ 
        v7_startTransition: true,
        v7_relativeSplatPath: true 
      }}>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          {/* App Bar */}
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                🛡️ Helm Control v1.0
              </Typography>
              
              {/* Connection Status */}
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Helm: {helmConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </Typography>
              </Box>

              {/* Notifications */}
              <IconButton color="inherit">
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Toolbar>
          </AppBar>

          {/* Notifications */}
          {notifications.map((notification) => (
            <Alert
              key={notification.id}
              severity={notification.type}
              sx={{
                position: 'fixed',
                top: 80,
                right: 20,
                zIndex: 9999,
                minWidth: 300,
              }}
              onClose={() => {
                setNotifications(prev => prev.filter(n => n.id !== notification.id));
              }}
            >
              {notification.message}
            </Alert>
          ))}

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              mt: 8,
              bgcolor: 'background.default',
              overflow: 'auto',
            }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              {navigationItems.map((item) => (
                <Route
                  key={item.id}
                  path={`/${item.id}`}
                  element={<item.component onNotification={addNotification} />}
                />
              ))}
            </Routes>
          </Box>

          {/* Navigation Sidebar */}
          <Box
            sx={{
              width: 240,
              borderLeft: '1px solid #333',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6">Navigation</Typography>
            </Box>
            
            {navigationItems.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  bgcolor: currentPage === item.id ? 'action.selected' : 'transparent',
                }}
                onClick={() => setCurrentPage(item.id)}
              >
                <Box sx={{ mr: 2 }}>{item.icon}</Box>
                <Typography>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
