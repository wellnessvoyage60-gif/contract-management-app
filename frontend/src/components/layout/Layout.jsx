import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
  Divider, useMediaQuery, useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description,
  Add,
  Archive,
  BarChart,
  People,
  Settings,
  Logout,
  Menu as MenuIcon,
  Person,
  Notifications
} from '@mui/icons-material';

const SIDEBAR_WIDTH = 280;

const navigationItems = [
  { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { title: 'All Contracts', path: '/contracts', icon: <Description /> },
  { title: 'Add Contract', path: '/contracts/upload', icon: <Add /> },
  { title: 'Archive', path: '/archive', icon: <Archive /> },
  { title: 'Reports', path: '/reports', icon: <BarChart /> },
];

const adminItems = [
  { title: 'User Management', path: '/admin/users', icon: <People /> },
  { title: 'Settings', path: '/settings', icon: <Settings /> },
];

export default function Layout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
      display: 'flex',
      flexDirection: 'column',
      color: 'white',
    }}>
      {/* Logo Section */}
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
      }}>
        <Box sx={{
          width: 100,
          height: 100,
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'rgba(255,255,255,0.15)',
            transform: 'scale(1.05)',
          },
        }}>
          <Description sx={{ fontSize: 48, opacity: 0.9 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          ContractPro
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.75rem' }}>
          Banglalink CLM Platform
        </Typography>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: '10px',
                color: 'rgba(255,255,255,0.9)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: '3px',
                  background: 'white',
                  transform: isActive(item.path) ? 'scaleY(1)' : 'scaleY(0)',
                  transition: 'transform 0.3s ease',
                },
                '&:hover, &.active': {
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  transform: 'translateX(5px)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                },
                ...(isActive(item.path) && {
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  transform: 'translateX(5px)',
                }),
              }}
            >
              <ListItemIcon sx={{ 
                color: 'inherit', 
                minWidth: 40,
                '& .MuiSvgIcon-root': { fontSize: '1.3rem' },
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.title} 
                primaryTypographyProps={{ 
                  fontWeight: 500,
                  fontSize: '0.95rem',
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}

        {user?.role === 'admin' && (
          <>
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.15)' }} />
            {adminItems.map((item) => (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: '10px',
                    color: 'rgba(255,255,255,0.9)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      transform: 'translateX(5px)',
                    },
                    ...(isActive(item.path) && {
                      background: 'rgba(255,255,255,0.2)',
                      transform: 'translateX(5px)',
                    }),
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: 'inherit', 
                    minWidth: 40,
                    '& .MuiSvgIcon-root': { fontSize: '1.3rem' },
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title}
                    primaryTypographyProps={{ 
                      fontWeight: 500,
                      fontSize: '0.95rem',
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>

      {/* Footer */}
      <Box sx={{ 
        p: 2, 
        pt: 1.5,
        mt: 'auto',
        borderTop: '1px solid rgba(255,255,255,0.15)',
        textAlign: 'center',
      }}>
        <Typography variant="caption" sx={{ opacity: 0.75, fontSize: '0.75rem' }}>
          © 2026 ContractPro
        </Typography>
        <Typography variant="caption" sx={{ 
          display: 'block', 
          opacity: 0.6, 
          fontSize: '0.7rem',
          mt: 0.5,
        }}>
          Banglalink Digital Communications Ltd.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          ml: { md: `${SIDEBAR_WIDTH}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          borderBottom: '1px solid #e9ecef',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50' }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Notifications />
          </IconButton>

          <IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
            <Avatar sx={{ 
              background: 'linear-gradient(135deg, #1a2980, #26d0ce)',
              width: 40,
              height: 40,
            }}>
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 220,
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e9ecef' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ 
                  background: 'linear-gradient(135deg, #1a2980, #26d0ce)',
                  width: 32,
                  height: 32,
                }}>
                  {user?.username?.[0]?.toUpperCase() || 'A'}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {user?.username || 'Admin'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.role || 'Administrator'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <MenuItem onClick={() => { navigate('/profile'); handleUserMenuClose(); }}>
              <ListItemIcon><Person fontSize="small" /></ListItemIcon>
              My Profile
            </MenuItem>
            <MenuItem onClick={() => { navigate('/settings'); handleUserMenuClose(); }}>
              <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'error.main' }}>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: SIDEBAR_WIDTH,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: SIDEBAR_WIDTH,
              border: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.08)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          mt: '64px',
          bgcolor: '#ffffff',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}