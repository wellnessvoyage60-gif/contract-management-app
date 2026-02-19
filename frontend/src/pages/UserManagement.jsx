import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/layout/Layout';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Chip, Box, Typography, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  IconButton
} from '@mui/material';
import { Sync, PersonAdd, Close } from '@mui/icons-material';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  // Vendor creation dialog
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    username: '', email: '', full_name: '', company: '', password: ''
  });
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState('');

  const fetchUsers = () => {
    api.get('/users')
      .then((res) => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    setMessage('');
    try {
      const res = await api.post('/users/sync-ad');
      setMessage(res.data.message);
      fetchUsers();
    } catch (err) {
      setMessage('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateVendor = async () => {
    setVendorError('');
    const { username, email, full_name, password } = vendorForm;

    if (!username || !email || !full_name || !password) {
      setVendorError('All fields except Company are required');
      return;
    }
    if (password.length < 8) {
      setVendorError('Password must be at least 8 characters');
      return;
    }

    setVendorLoading(true);
    try {
      const formData = new URLSearchParams();
      Object.entries(vendorForm).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });

      const res = await api.post('/vendors/create', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      setMessage(res.data.message);
      setShowVendorDialog(false);
      setVendorForm({ username: '', email: '', full_name: '', company: '', password: '' });
      fetchUsers();
    } catch (err) {
      setVendorError(err.response?.data?.detail || 'Failed to create vendor');
    } finally {
      setVendorLoading(false);
    }
  };

  const roleColors = { admin: 'error', user: 'primary', vendor: 'warning' };

  return (
    <Layout title='User Management'>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant='h5' fontWeight='bold' color='#1B4F72'>
          Users ({users.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant='outlined' startIcon={<PersonAdd />}
            onClick={() => setShowVendorDialog(true)}
            sx={{ borderColor: '#F39C12', color: '#F39C12',
                  '&:hover': { borderColor: '#E67E22', bgcolor: '#FEF9E7' } }}>
            Create Vendor
          </Button>
          <Button variant='contained' startIcon={<Sync />}
            onClick={handleSync} disabled={syncing}
            sx={{ bgcolor: '#1B4F72', '&:hover': { bgcolor: '#154360' } }}>
            {syncing ? 'Syncing...' : 'Sync from AD'}
          </Button>
        </Box>
      </Box>

      {message && <Alert severity='info' sx={{ mb: 2 }}>{message}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F8F9FA' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.department || '-'}</TableCell>
                  <TableCell>
                    <Chip label={u.role} size='small'
                      color={roleColors[u.role] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Chip label={u.is_active ? 'Yes' : 'No'} size='small'
                      color={u.is_active ? 'success' : 'default'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Vendor Dialog */}
      <Dialog open={showVendorDialog} onClose={() => setShowVendorDialog(false)}
        maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Create Vendor Account
            <IconButton onClick={() => setShowVendorDialog(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {vendorError && <Alert severity='error' sx={{ mb: 2 }}>{vendorError}</Alert>}

          <TextField fullWidth label='Username' required margin='normal'
            value={vendorForm.username}
            onChange={(e) => setVendorForm({...vendorForm, username: e.target.value})}
            helperText='Vendor will use this to log in' />

          <TextField fullWidth label='Email' type='email' required margin='normal'
            value={vendorForm.email}
            onChange={(e) => setVendorForm({...vendorForm, email: e.target.value})} />

          <TextField fullWidth label='Full Name' required margin='normal'
            value={vendorForm.full_name}
            onChange={(e) => setVendorForm({...vendorForm, full_name: e.target.value})} />

          <TextField fullWidth label='Company Name' margin='normal'
            value={vendorForm.company}
            onChange={(e) => setVendorForm({...vendorForm, company: e.target.value})} />

          <TextField fullWidth label='Password' type='password' required margin='normal'
            value={vendorForm.password}
            onChange={(e) => setVendorForm({...vendorForm, password: e.target.value})}
            helperText='Minimum 8 characters. Share this with the vendor.' />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVendorDialog(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleCreateVendor}
            disabled={vendorLoading} sx={{ bgcolor: '#1B4F72' }}>
            {vendorLoading ? 'Creating...' : 'Create Vendor'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}