import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/layout/Layout';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, TextField, Box, Typography, CircularProgress,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';

const statusColors = {
  draft: 'default',
  in_review: 'warning',
  vendor_feedback: 'info',
  approved: 'success',
  signed: 'secondary',
};

export default function ContractsList() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/contracts')
      .then((res) => setContracts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = contracts.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.contract_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <Layout title='Contracts'>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
          <TextField size='small' placeholder='Search contracts...'
            value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250 }} />
          <FormControl size='small' sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label='Status'
              onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value='all'>All</MenuItem>
              <MenuItem value='draft'>Draft</MenuItem>
              <MenuItem value='in_review'>In Review</MenuItem>
              <MenuItem value='vendor_feedback'>Vendor Feedback</MenuItem>
              <MenuItem value='approved'>Approved</MenuItem>
              <MenuItem value='signed'>Signed</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Button variant='contained' startIcon={<Add />}
          onClick={() => navigate('/contracts/upload')}
          sx={{ bgcolor: '#0d6efd', '&:hover': { bgcolor: '#0b5ed7' } }}>
          New Contract
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F8F9FA' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Contract #</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vendor</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align='center' sx={{ py: 5 }}>
                    <Typography color='text.secondary'>No contracts found</Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.contract_number}</TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>{c.category?.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Chip label={c.status?.replace('_', ' ')} size='small'
                      color={statusColors[c.status] || 'default'} />
                  </TableCell>
                  <TableCell>{c.vendor_name || '-'}</TableCell>
                  <TableCell>{c.created_at?.split('T')[0]}</TableCell>
                  <TableCell>
                    <Button size='small' startIcon={<Visibility />}
                      onClick={() => navigate(`/contracts/${c.id}`)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Layout>
  );
}
