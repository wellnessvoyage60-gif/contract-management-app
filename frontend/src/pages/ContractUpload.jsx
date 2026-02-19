import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/layout/Layout';
import {
  Card, CardContent, TextField, Button, Box, Typography,
  FormControl, InputLabel, Select, MenuItem, Alert, Grid
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

export default function ContractUpload() {
  const [form, setForm] = useState({
    title: '', category: '', vendor_name: '',
    contract_value: '', sla_days: '', reviewer_id: ''
  });
  const [file, setFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/users').then((res) => setUsers(res.data)).catch(console.error);
  }, []);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!file) { setError('Please select a .docx file'); return; }
    setLoading(true);

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('category', form.category);
    formData.append('vendor_name', form.vendor_name);
    formData.append('contract_value', form.contract_value || '0');
    formData.append('sla_days', form.sla_days);
    formData.append('reviewer_id', form.reviewer_id);
    formData.append('file', file);

    try {
      const res = await api.post('/contracts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(`Contract ${res.data.contract_number} uploaded successfully!`);
      setTimeout(() => navigate('/contracts'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title='Upload Contract'>
      <Card elevation={2} sx={{ borderRadius: 2, maxWidth: 800, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant='h5' fontWeight='bold' color='#1B4F72' gutterBottom>
            New Contract
          </Typography>

          {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity='success' sx={{ mb: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label='Contract Title' required
                  value={form.title} onChange={handleChange('title')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select value={form.category} label='Category'
                    onChange={handleChange('category')}>
                    <MenuItem value='supply_service'>Supply & Service</MenuItem>
                    <MenuItem value='service'>Service</MenuItem>
                    <MenuItem value='msa'>MSA</MenuItem>
                    <MenuItem value='nda'>NDA</MenuItem>
                    <MenuItem value='bida_basis'>BIDA/BASIS</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label='Vendor Name'
                  value={form.vendor_name} onChange={handleChange('vendor_name')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label='Contract Value' type='number'
                  value={form.contract_value} onChange={handleChange('contract_value')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label='SLA (Working Days)' type='number' required
                  value={form.sla_days} onChange={handleChange('sla_days')} />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Assign Reviewer</InputLabel>
                  <Select value={form.reviewer_id} label='Assign Reviewer'
                    onChange={handleChange('reviewer_id')}>
                    {users.filter(u => u.role !== 'vendor').map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.full_name} ({u.department})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button variant='outlined' component='label' fullWidth
                  startIcon={<CloudUpload />} sx={{ py: 2 }}>
                  {file ? file.name : 'Choose .docx File'}
                  <input type='file' hidden accept='.docx'
                    onChange={(e) => setFile(e.target.files[0])} />
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Button type='submit' variant='contained' fullWidth size='large'
                  disabled={loading}
                  sx={{ py: 1.5, bgcolor: '#0d6efd', '&:hover': { bgcolor: '#0b5ed7' } }}>
                  {loading ? 'Uploading...' : 'Upload Contract'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Layout>
  );
}
