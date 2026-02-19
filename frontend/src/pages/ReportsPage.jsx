import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/layout/Layout';
import {
  Box, Card, CardContent, Typography, Button,
  FormControl, InputLabel, Select, MenuItem, TextField,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Divider
} from '@mui/material';
import { Grid } from '@mui/material'; // ✅ MUI v6 Grid2
import {
  BarChart as BarChartIcon, FileDownload, FilterList,
  Assignment, Schedule, TrendingUp
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const STATUS_COLORS = {
  draft:           '#6c757d',
  in_review:       '#ffc107',
  vendor_feedback: '#0dcaf0',
  approved:        '#198754',
  signed:          '#6f42c1',
};
const PIE_COLORS = ['#0d6efd', '#ffc107', '#0dcaf0', '#198754', '#6c757d'];

export default function ReportsPage() {
  const [stats, setStats]       = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError]       = useState('');
  const [filters, setFilters]   = useState({ status: 'all', from: '', to: '' });

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/contracts'),
    ])
      .then(([statsRes, contractsRes]) => {
        setStats(statsRes.data);
        setContracts(Array.isArray(contractsRes.data) ? contractsRes.data : []);
      })
      .catch((err) => {
        if (err.code === 'ERR_NETWORK' || err.code === 'ERR_CONNECTION_REFUSED') {
          setError('Cannot connect to the backend server. Please make sure FastAPI is running on port 8000.');
        } else {
          setError('Failed to load report data.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.from) params.append('from_date', filters.from);
      if (filters.to)   params.append('to_date',   filters.to);

      const res = await api.get(`/reports/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `contractpro_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Export failed. Make sure the backend /reports/export endpoint exists.');
    } finally {
      setExporting(false);
    }
  };

  // Chart data
  const barData = stats ? [
    { name: 'Draft',           value: stats.drafts           || 0 },
    { name: 'In Review',       value: stats.in_review        || 0 },
    { name: 'Vendor Feedback', value: stats.vendor_feedback  || 0 },
    { name: 'Approved',        value: stats.approved         || 0 },
    { name: 'Signed',          value: stats.signed           || 0 },
  ] : [];
  const pieData = barData.filter((d) => d.value > 0);

  // Filtered table rows
  const filtered = contracts.filter((c) => {
    const matchStatus = filters.status === 'all' || c.status === filters.status;
    const matchFrom   = !filters.from || new Date(c.created_at) >= new Date(filters.from);
    const matchTo     = !filters.to   || new Date(c.created_at) <= new Date(filters.to);
    return matchStatus && matchFrom && matchTo;
  });

  if (loading) {
    return (
      <Layout title="Reports" subtitle="Contract analytics and activity reports">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Reports" subtitle="Contract analytics and activity reports">

      {/* ── Backend error banner ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* ── Filters & Export ── */}
      <Card elevation={2} sx={{ borderRadius: '12px', mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList color="primary" />
          <Typography variant="h6" fontWeight="bold">Filter Report</Typography>
        </Box>
        <CardContent sx={{ p: 3 }}>
          {/* ✅ MUI v6 Grid2 — no item / xs / sm / md props */}
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={filters.status} label="Status"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="in_review">In Review</MenuItem>
                  <MenuItem value="vendor_feedback">Vendor Feedback</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="signed">Signed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField fullWidth size="small" label="From Date" type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField fullWidth size="small" label="To Date" type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Button fullWidth variant="contained" startIcon={<FileDownload />}
                onClick={handleExport} disabled={exporting}
                sx={{ bgcolor: '#198754', '&:hover': { bgcolor: '#157347' } }}>
                {exporting ? 'Exporting…' : 'Export Excel'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── KPI Cards ── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Total Contracts', value: stats?.total_contracts || 0, icon: <Assignment />, color: '#0d6efd' },
          { label: 'Active Reviews',  value: (stats?.in_review || 0) + (stats?.vendor_feedback || 0), icon: <Schedule />,   color: '#ffc107' },
          { label: 'Approved',        value: stats?.approved || 0,        icon: <TrendingUp />, color: '#198754' },
          { label: 'Signed & Closed', value: stats?.signed   || 0,        icon: <Assignment />, color: '#6f42c1' },
        ].map((kpi, i) => (
          <Grid key={i} size={{ xs: 6, md: 3 }}>
            <Card elevation={2} sx={{
              borderRadius: '12px',
              borderLeft: `4px solid ${kpi.color}`,
              transition: 'all 0.3s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
            }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">{kpi.label}</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: kpi.color }}>{kpi.value}</Typography>
                </Box>
                <Box sx={{ color: kpi.color, opacity: 0.2, '& svg': { fontSize: 50 } }}>{kpi.icon}</Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Charts ── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card elevation={2} sx={{ borderRadius: '12px', p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#0d6efd' }} />
              Contracts by Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {barData.every(d => d.value === 0) ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary">No data available yet.</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={Object.values(STATUS_COLORS)[i] || '#0d6efd'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card elevation={2} sx={{ borderRadius: '12px', p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Status Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {pieData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary">No data available yet.</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={90} label>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ── Detail Table ── */}
      <Card elevation={2} sx={{ borderRadius: '12px' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            Contract Activity Report
            <Chip label={filtered.length} size="small" sx={{ ml: 1 }} />
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                {['Contract #','Title','Status','Category','Vendor','Handler','SLA Days','Created'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">
                      {contracts.length === 0
                        ? 'No contracts found. Make sure the backend is running.'
                        : 'No contracts match the selected filters.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#0d6efd' }}>{c.contract_number}</TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>
                    <Chip label={c.status?.replace(/_/g, ' ')} size="small" sx={{
                      bgcolor: (STATUS_COLORS[c.status] || '#999') + '22',
                      color:    STATUS_COLORS[c.status] || '#999',
                      fontWeight: 600,
                      borderRadius: '20px',
                      border: `1px solid ${(STATUS_COLORS[c.status] || '#999')}44`,
                      textTransform: 'capitalize',
                    }} />
                  </TableCell>
                  <TableCell>{c.category?.replace(/_/g, ' ') || '—'}</TableCell>
                  <TableCell>{c.vendor_name || '—'}</TableCell>
                  <TableCell>{c.current_handler || '—'}</TableCell>
                  <TableCell>{c.sla_days || 7}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Layout>
  );
}