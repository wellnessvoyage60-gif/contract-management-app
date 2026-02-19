import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/layout/Layout';
import {
  Box, Card, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Search, CloudUpload, Download, Visibility, Archive,
  Business, CalendarToday, AttachMoney, Close
} from '@mui/icons-material';

export default function ArchivePage() {
  const [documents, setDocuments]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [uploadOpen, setUploadOpen]     = useState(false);
  const [viewDoc, setViewDoc]           = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  const [form, setForm] = useState({
    contract_title: '', vendor_name: '', contract_value: '',
    currency: 'BDT', start_date: '', end_date: '',
    termination_period_days: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = () => {
    setLoading(true);
    api.get('/archive')
      .then((res) => setDocuments(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        if (err.code === 'ERR_NETWORK' || err.response?.status === undefined) {
          setError('Cannot connect to backend. Please start your FastAPI server.');
        } else if (err.response?.status === 404) {
          setError('Archive endpoint not found. Check that archive.router is registered in main.py at /api/archive.');
        } else {
          setError('Failed to load archive documents.');
        }
      })
      .finally(() => setLoading(false));
  };

  // -- Authenticated download — sends JWT token in header ------
  const handleDownload = async (docId, filename) => {
    try {
      const res = await api.get(`/archive/${docId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename || `contract_${docId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.detail || 'Download failed. Please try again.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a PDF file.'); return; }
    setUploading(true);
    setError('');
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => v && formData.append(k, v));
    formData.append('file', file);
    try {
      await api.post('/archive/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadSuccess('Document archived successfully!');
      setUploadOpen(false);
      setForm({
        contract_title: '', vendor_name: '', contract_value: '',
        currency: 'BDT', start_date: '', end_date: '',
        termination_period_days: '',
      });
      setFile(null);
      fetchDocs();
      setTimeout(() => setUploadSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Check the /api/archive/upload endpoint exists.');
    } finally {
      setUploading(false);
    }
  };

  const filtered = documents.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.contract_title?.toLowerCase().includes(q) ||
      d.vendor_name?.toLowerCase().includes(q) ||
      String(d.contract_value || '').includes(q)
    );
  });

  return (
    <Layout title="Archive" subtitle="Signed contract repository and document storage">

      {uploadSuccess && <Alert severity="success" sx={{ mb: 2 }}>{uploadSuccess}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Top bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search by vendor, title, value…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ minWidth: 300 }} />
        <Button variant="contained" startIcon={<CloudUpload />}
          onClick={() => setUploadOpen(true)}
          sx={{ bgcolor: '#0d6efd', '&:hover': { bgcolor: '#0b5ed7' } }}>
          Archive Signed Contract
        </Button>
      </Box>

      {/* Table */}
      <Card elevation={2} sx={{ borderRadius: '12px' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Archive color="primary" />
          <Typography variant="h6" fontWeight="bold">Archived Documents</Typography>
          <Chip label={filtered.length} size="small" sx={{ ml: 1 }} />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                <TableRow>
                  {['Contract Title','Vendor','Value','Start Date','End Date','Archived On','Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Archive sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
                        <Typography color="text.secondary" gutterBottom>No archived documents found.</Typography>
                        <Button variant="contained" startIcon={<CloudUpload />}
                          onClick={() => setUploadOpen(true)}
                          sx={{ mt: 1, bgcolor: '#0d6efd', '&:hover': { bgcolor: '#0b5ed7' } }}>
                          Archive First Document
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {doc.contract_title || doc.original_filename}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business fontSize="small" color="action" />{doc.vendor_name || '—'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {doc.contract_value
                        ? `${doc.currency || 'BDT'} ${Number(doc.contract_value).toLocaleString()}`
                        : '—'}
                    </TableCell>
                    <TableCell>{doc.start_date ? new Date(doc.start_date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{doc.end_date   ? new Date(doc.end_date).toLocaleDateString()   : '—'}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" color="primary" onClick={() => setViewDoc(doc)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleDownload(doc.id, doc.original_filename)}
                          title="Download PDF"
                        >
                          <Download fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUpload color="primary" /> Archive Signed Contract
          </Box>
          <IconButton onClick={() => setUploadOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <form onSubmit={handleUpload}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField fullWidth label="Contract Title" required
                  value={form.contract_title}
                  onChange={(e) => setForm({ ...form, contract_title: e.target.value })} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="Vendor Name" required
                  value={form.vendor_name}
                  onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} />
              </Grid>
              <Grid size={8}>
                <TextField fullWidth label="Contract Value" type="number"
                  value={form.contract_value}
                  onChange={(e) => setForm({ ...form, contract_value: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoney /></InputAdornment> }} />
              </Grid>
              <Grid size={4}>
                <TextField fullWidth label="Currency" value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Start Date" type="date" required
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="End Date" type="date" required
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="Termination Notice (days)" type="number"
                  value={form.termination_period_days}
                  onChange={(e) => setForm({ ...form, termination_period_days: e.target.value })} />
              </Grid>
              <Grid size={12}>
                <Button variant="outlined" component="label" fullWidth startIcon={<CloudUpload />}
                  sx={{ py: 2, borderStyle: 'dashed', borderRadius: '8px' }}>
                  {file ? `? ${file.name}` : 'Upload Signed PDF'}
                  <input type="file" hidden accept=".pdf"
                    onChange={(e) => setFile(e.target.files[0])} />
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={uploading}
              sx={{ bgcolor: '#0d6efd', '&:hover': { bgcolor: '#0b5ed7' } }}>
              {uploading ? 'Archiving…' : 'Archive Document'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewDoc} onClose={() => setViewDoc(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}>
        {viewDoc && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {viewDoc.contract_title || viewDoc.original_filename}
              <IconButton onClick={() => setViewDoc(null)} size="small"><Close /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {[
                { icon: <Business />,      label: 'Vendor',             value: viewDoc.vendor_name },
                { icon: <AttachMoney />,   label: 'Value',              value: viewDoc.contract_value ? `${viewDoc.currency} ${Number(viewDoc.contract_value).toLocaleString()}` : '—' },
                { icon: <CalendarToday />, label: 'Start Date',         value: viewDoc.start_date ? new Date(viewDoc.start_date).toLocaleDateString() : '—' },
                { icon: <CalendarToday />, label: 'End Date',           value: viewDoc.end_date   ? new Date(viewDoc.end_date).toLocaleDateString()   : '—' },
                { icon: <CalendarToday />, label: 'Termination Notice', value: viewDoc.termination_period_days ? `${viewDoc.termination_period_days} days` : '—' },
              ].map((row, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                  <Box sx={{ color: 'text.secondary', mr: 2 }}>{row.icon}</Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                    <Typography fontWeight={500}>{row.value}</Typography>
                  </Box>
                </Box>
              ))}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setViewDoc(null)}>Close</Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<Download />}
                onClick={() => handleDownload(viewDoc.id, viewDoc.original_filename)}
              >
                Download PDF
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Layout>
  );
}