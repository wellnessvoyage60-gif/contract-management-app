import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/layout/Layout';
import {
  Card, CardContent, TextField, Button, Typography, Alert,
  Grid, Divider
} from '@mui/material';

export default function VendorProfile() {
  const [profile, setProfile] = useState({ full_name: '', email: '', company: '' });
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    api.get('/vendors/profile')
      .then((res) => setProfile(res.data))
      .catch(console.error);
  }, []);

  const handleUpdateProfile = async () => {
    setMsg('');
    try {
      const formData = new URLSearchParams();
      formData.append('full_name', profile.full_name);
      formData.append('company', profile.company);
      await api.put('/vendors/profile', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      setMsg('Profile updated successfully');
    } catch (err) {
      setMsg('Update failed');
    }
  };

  const handleChangePassword = async () => {
    setPwMsg('');
    try {
      const formData = new URLSearchParams();
      formData.append('old_password', oldPw);
      formData.append('new_password', newPw);
      await api.put('/vendors/change-password', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      setPwMsg('Password changed successfully');
      setOldPw('');
      setNewPw('');
    } catch (err) {
      setPwMsg(err.response?.data?.detail || 'Password change failed');
    }
  };

  return (
    <Layout title='Vendor Profile'>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom>Profile Details</Typography>
              {msg && <Alert severity='info' sx={{ mb: 2 }}>{msg}</Alert>}
              <TextField fullWidth label='Full Name' margin='normal'
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
              <TextField fullWidth label='Email' margin='normal' disabled
                value={profile.email} />
              <TextField fullWidth label='Company' margin='normal'
                value={profile.company || ''}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
              <Button variant='contained' onClick={handleUpdateProfile}
                sx={{ mt: 2, bgcolor: '#1B4F72' }}>
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom>Change Password</Typography>
              {pwMsg && <Alert severity='info' sx={{ mb: 2 }}>{pwMsg}</Alert>}
              <TextField fullWidth label='Current Password' type='password'
                margin='normal' value={oldPw}
                onChange={(e) => setOldPw(e.target.value)} />
              <TextField fullWidth label='New Password' type='password'
                margin='normal' value={newPw}
                onChange={(e) => setNewPw(e.target.value)} />
              <Button variant='contained' onClick={handleChangePassword}
                sx={{ mt: 2, bgcolor: '#1B4F72' }}>
                Change Password
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  );
}
