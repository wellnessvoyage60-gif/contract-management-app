import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Divider, Box
} from '@mui/material';
import {
  Dashboard, Description, CloudUpload, People, Archive,
  Assessment, Storefront, Logout
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['admin', 'user'] },
  { text: 'Contracts', icon: <Description />, path: '/contracts', roles: ['admin', 'user'] },
  { text: 'Upload Contract', icon: <CloudUpload />, path: '/contracts/upload', roles: ['admin', 'user'] },
  { text: 'User Management', icon: <People />, path: '/users', roles: ['admin'] },
  { text: 'Archive', icon: <Archive />, path: '/archive', roles: ['admin', 'user'] },
  { text: 'Reports', icon: <Assessment />, path: '/reports', roles: ['admin', 'user'] },
  { text: 'Vendor Portal', icon: <Storefront />, path: '/vendor/dashboard', roles: ['vendor'] },
  { text: 'Vendor Profile', icon: <Storefront />, path: '/vendor/profile', roles: ['vendor'] },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = menuItems.filter(
    (item) => item.roles.includes(user?.role)
  );

  return (
    <Drawer variant='permanent' sx={{
      width: DRAWER_WIDTH, flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: DRAWER_WIDTH, boxSizing: 'border-box',
        bgcolor: '#1B4F72', color: 'white'
      },
    }}>
      <Toolbar sx={{ py: 2 }}>
        <Box>
          <Typography variant='h6' fontWeight='bold' color='white'>
            Contract Mgmt
          </Typography>
          <Typography variant='caption' color='#85C1E9'>
            {user?.username} ({user?.role})
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: '#2E86C1' }} />

      <List sx={{ flex: 1 }}>
        {visibleItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                py: 1.5, mx: 1, borderRadius: 1, mb: 0.5,
                '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.15)' },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}>
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: '#2E86C1' }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ py: 1.5, mx: 1, borderRadius: 1 }}>
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <Logout />
            </ListItemIcon>
            <ListItemText primary='Logout' />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
