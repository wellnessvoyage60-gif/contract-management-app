import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/layout/Layout';
import {
  Box, Card, CardContent, Typography, Chip, Button,
  Divider, CircularProgress, Alert, Avatar, List, ListItem,
  ListItemAvatar, ListItemText, Tooltip
} from '@mui/material';
import { Grid } from '@mui/material';  // ✅ MUI v7
import {
  ArrowBack, Edit, Download, Delete, CheckCircle,
  Schedule, Person, Category, Business, CalendarToday,
  Assignment, History, Send
} from '@mui/icons-material';

const statusColors = {
  draft:           { color: 'default',  label: 'Draft' },
  in_review:       { color: 'warning',  label: 'In Review' },
  vendor_feedback: { color: 'info',     label: 'Vendor Feedback' },
  approved:        { color: 'success',  label: 'Approved' },
  signed:          { color: 'secondary',label: 'Signed' },
};

function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
      <Box sx={{ color: 'text.secondary', mr: 2, mt: 0.3 }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
          {label}
        </Typography>
        <Typography variant="body1" fontWeight={500} sx={{ mt: 0.3 }}>
          {value || '—'}
        </Typography>
      </Box>
    </Box>
  );
}

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/contracts/${id}`),
      api.get(`/contracts/${id}/activities`).catch(() => ({ data: [] })),
    ])
      .then(([contractRes, activitiesRes]) => {
        setContract(contractRes.data);
        setActivities(activitiesRes.data || []);
      })
      .catch(() => setError('Contract not found or you do not have access.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this contract? This cannot be undone.')) return;
    try {
      await api.delete(`/contracts/${id}`);
      navigate('/contracts');
    } catch {
      setError('Failed to delete contract.');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/contracts/${id}/status`, { status: newStatus });
      setContract((c) => ({ ...c, status: newStatus }));
      setActionMsg(`Status updated to ${newStatus.replace('_', ' ')}`);
      setTimeout(() => setActionMsg(''), 3000);
      // Reload activities to show the new status change
      const { data } = await api.get(`/contracts/${id}/activities`);
      setActivities(data || []);
    } catch {
      setError('Failed to update status.');
    }
  };

  if (loading) {
    return (
      <Layout title="Contract Details">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error && !contract) {
    return (
      <Layout title="Contract Details">
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/contracts')} sx={{ mt: 2 }}>
          Back to Contracts
        </Button>
      </Layout>
    );
  }

  const status = statusColors[contract.status] || { color: 'default', label: contract.status };

  return (
    <Layout
      title={contract.title}
      subtitle={`Contract Details — ${contract.contract_number || `#${contract.id}`}`}
    >
      {/* Action Alerts */}
      {actionMsg && <Alert severity="success" sx={{ mb: 2 }}>{actionMsg}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Top action bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Button startIcon={<ArrowBack />} variant="outlined" onClick={() => navigate('/contracts')}>
          Back to Contracts
        </Button>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/editor/${id}`)}
            sx={{ bgcolor: '#0d6efd', '&:hover': { bgcolor: '#0b5ed7' } }}
          >
            Edit Document
          </Button>
          {contract.has_document && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<Download />}
              href={`${api.defaults.baseURL}/contracts/${id}/download`}
              target="_blank"
            >
              Download
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* ✅ MUI v7 Grid — use size={{ xs, lg }} instead of item xs lg */}
      <Grid container spacing={3}>
        {/* Left — Main Info */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={2} sx={{ borderRadius: '12px', mb: 3 }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e9ecef' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h5" fontWeight="bold">{contract.title}</Typography>
                <Chip
                  label={status.label}
                  color={status.color}
                  sx={{ fontWeight: 600, borderRadius: '20px' }}
                />
                <Chip
                  label={`SLA: ${contract.sla_days || 7} days`}
                  variant="outlined"
                  icon={<Schedule sx={{ fontSize: '1rem !important' }} />}
                  size="small"
                />
              </Box>
              {contract.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {contract.description}
                </Typography>
              )}
            </Box>

            <CardContent sx={{ p: 3 }}>
              <InfoRow icon={<Assignment />}     label="Contract Number" value={contract.contract_number || `CTR-${id}`} />
              <InfoRow icon={<Category />}       label="Category"        value={contract.category?.replace(/_/g, ' ') || 'General'} />
              <InfoRow icon={<Business />}       label="Vendor"          value={contract.vendor_name || contract.vendor} />
              <InfoRow icon={<Person />}         label="Current Handler" value={contract.current_handler || 'Not assigned'} />
              <InfoRow icon={<Person />}         label="Uploaded By"     value={contract.uploaded_by || 'Unknown'} />
              <InfoRow icon={<CalendarToday />}  label="Created"
                value={contract.created_at ? new Date(contract.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                }) : null}
              />
              {contract.contract_value && (
                <InfoRow icon={<Assignment />} label="Contract Value"
                  value={`${contract.currency || 'BDT'} ${Number(contract.contract_value).toLocaleString()}`} />
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card elevation={2} sx={{ borderRadius: '12px' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e9ecef' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <History color="primary" /> Activity Log
              </Typography>
            </Box>
            <CardContent sx={{ p: 0 }}>
              {activities.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography color="text.secondary">No activity recorded yet.</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {activities.map((act, idx) => (
                    <ListItem key={idx} divider sx={{ px: 3, py: 2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36, fontSize: '0.85rem' }}>
                          {act.user?.[0]?.toUpperCase() || 'S'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={act.action || act.activity_type || act.description}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', gap: 2, flexDirection: 'column', mt: 0.5 }}>
                            <span style={{ fontWeight: 500 }}>{act.user || 'System'}</span>
                            <span style={{ fontSize: '0.8rem' }}>
                              {act.created_at ? new Date(act.created_at).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              }) : ''}
                            </span>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right — Status & Actions */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Status Change */}
          <Card elevation={2} sx={{ borderRadius: '12px', mb: 3 }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e9ecef' }}>
              <Typography variant="h6" fontWeight="bold">
                <Send sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.1rem' }} />
                Change Status
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { status: 'in_review',       label: 'Send for Review',    color: 'warning' },
                  { status: 'vendor_feedback', label: 'Send to Vendor',     color: 'info' },
                  { status: 'approved',        label: 'Mark as Approved',   color: 'success' },
                  { status: 'signed',          label: 'Mark as Signed',     color: 'secondary' },
                ].map((item) => (
                  <Button
                    key={item.status}
                    variant={contract.status === item.status ? 'contained' : 'outlined'}
                    color={item.color}
                    fullWidth
                    startIcon={<CheckCircle />}
                    onClick={() => handleStatusChange(item.status)}
                    disabled={contract.status === item.status}
                    sx={{ justifyContent: 'flex-start', borderRadius: '8px' }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Document Info */}
          {contract.has_document && (
            <Card elevation={2} sx={{ borderRadius: '12px' }}>
              <Box sx={{ p: 3, borderBottom: '1px solid #e9ecef' }}>
                <Typography variant="h6" fontWeight="bold">Document</Typography>
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: '8px' }}>
                  <Assignment color="primary" sx={{ fontSize: 36 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {contract.original_filename || 'Document'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Version {contract.version || 1}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    fullWidth variant="contained" size="small"
                    onClick={() => navigate(`/editor/${id}`)}
                    sx={{ bgcolor: '#0d6efd', '&:hover': { bgcolor: '#0b5ed7' } }}
                  >
                    Open Editor
                  </Button>
                  <Button
                    fullWidth variant="outlined" size="small" color="success"
                    href={`${api.defaults.baseURL}/contracts/${id}/download`}
                    target="_blank"
                  >
                    Download
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Layout>
  );
}