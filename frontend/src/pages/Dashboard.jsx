import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/layout/Layout';
import { 
  Grid, Card, CardContent, Typography, Box, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Chip
} from '@mui/material';
import { 
  Description, RateReview, CheckCircle, Archive, PendingActions,
  TrendingUp, Visibility 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function StatCard({ title, value, icon, color, trend }) {
  return (
    <Card 
      elevation={2}
      sx={{ 
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: '4px',
          background: `linear-gradient(180deg, ${color}, #26d0ce)`,
        },
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: 3, position: 'relative' }}>
        {/* Background Icon */}
        <Box sx={{ 
          position: 'absolute',
          right: 16,
          top: 16,
          opacity: 0.1,
          fontSize: '5rem',
          color: color,
        }}>
          {icon}
        </Box>

        {/* Content */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{
              background: `${color}1a`,
              p: 1.5,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}>
              <Box sx={{ color, fontSize: '1.8rem' }}>
                {icon}
              </Box>
            </Box>
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ fontSize: '0.85rem', mb: 0.5 }}
              >
                {title}
              </Typography>
              <Typography 
                variant="h3" 
                sx={{ fontWeight: 'bold', fontSize: '2.5rem', color }}
              >
                {value}
              </Typography>
            </Box>
          </Box>

          {/* Trend */}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
              <Typography variant="caption" color="success.main" fontWeight={500}>
                {trend}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                vs last month
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentContracts, setRecentContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/contracts?limit=5')
    ])
      .then(([statsRes, contractsRes]) => {
        setStats(statsRes.data);
        setRecentContracts(contractsRes.data.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Welcome to ContractPro - Banglalink CLM Platform">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  const statusColors = {
    draft: 'default',
    in_review: 'warning',
    vendor_feedback: 'info',
    approved: 'success',
    signed: 'secondary',
  };

  return (
    <Layout title="Dashboard" subtitle="Welcome to ContractPro - Banglalink CLM Platform">
      {/* Welcome Message */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          Welcome back! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your contracts today.
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard 
            title="Total Contracts" 
            value={stats?.total_contracts || 0}
            icon={<Description />} 
            color="#0d6efd"
            trend="+12%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard 
            title="In Draft" 
            value={stats?.drafts || 0}
            icon={<PendingActions />} 
            color="#ffc107"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard 
            title="In Review" 
            value={stats?.in_review || 0}
            icon={<RateReview />} 
            color="#0dcaf0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard 
            title="Approved" 
            value={stats?.approved || 0}
            icon={<CheckCircle />} 
            color="#198754"
            trend="+8%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard 
            title="Signed" 
            value={stats?.signed || 0}
            icon={<Archive />} 
            color="#6c757d"
          />
        </Grid>
      </Grid>

      {/* Recent Contracts */}
      <Card elevation={2} sx={{ borderRadius: '12px' }}>
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Description color="primary" />
              Recent Contracts
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Latest contract activities and updates
            </Typography>
          </Box>
          <Button 
            variant="contained"
            size="small"
            onClick={() => navigate('/contracts')}
            sx={{ 
              bgcolor: '#0d6efd',
              '&:hover': { bgcolor: '#0b5ed7' },
            }}
          >
            View All
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Contract #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">
                      No contracts yet. Upload your first contract to get started!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recentContracts.map((contract) => (
                  <TableRow 
                    key={contract.id} 
                    hover
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(13, 110, 253, 0.04)',
                        transform: 'scale(1.01)',
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: '#0d6efd' }}>
                      #{contract.contract_number}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {contract.title}
                        </Typography>
                        {contract.original_filename && (
                          <Typography variant="caption" color="text.secondary">
                            📎 {contract.original_filename}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={contract.status?.replace('_', ' ')}
                        size="small"
                        color={statusColors[contract.status] || 'default'}
                        sx={{ 
                          fontWeight: 500,
                          borderRadius: '20px',
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={contract.category?.replace('_', ' ') || 'General'}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: '20px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        📅 {new Date(contract.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        sx={{ minWidth: 'auto' }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Quick Actions & System Status */}
      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: '12px', height: '100%' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e9ecef' }}>
              <Typography variant="h6" fontWeight="bold">
                ⚡ Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Common tasks and shortcuts
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => navigate('/contracts/upload')}
                  sx={{
                    bgcolor: '#0d6efd',
                    py: 2,
                    justifyContent: 'flex-start',
                    '&:hover': { bgcolor: '#0b5ed7' },
                  }}
                >
                  <Box sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    p: 1.5, 
                    borderRadius: '8px', 
                    mr: 2,
                    display: 'flex',
                  }}>
                    <PendingActions />
                  </Box>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography fontWeight="bold">Add New Contract</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Create a new contract entry
                    </Typography>
                  </Box>
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => navigate('/contracts')}
                  sx={{ py: 2, justifyContent: 'flex-start' }}
                >
                  <Box sx={{ 
                    bgcolor: '#f8f9fa', 
                    p: 1.5, 
                    borderRadius: '8px', 
                    mr: 2,
                    display: 'flex',
                  }}>
                    <Description />
                  </Box>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography fontWeight="bold">View All Contracts</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Browse and manage contracts
                    </Typography>
                  </Box>
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: '12px', height: '100%' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e9ecef' }}>
              <Typography variant="h6" fontWeight="bold">
                🔧 System Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time system health monitoring
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: 'Database', status: 'Online', detail: 'Connected and responsive' },
                  { label: 'Storage', status: 'Ready', detail: 'Upload folder ready' },
                  { label: 'Application', status: 'Active', detail: 'Running smoothly' },
                ].map((item, idx) => (
                  <Box 
                    key={idx}
                    sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      bgcolor: '#f8f9fa',
                      borderRadius: '8px',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{
                        bgcolor: 'success.light',
                        color: 'success.main',
                        p: 1,
                        borderRadius: '8px',
                        mr: 2,
                      }}>
                        <CheckCircle />
                      </Box>
                      <Box>
                        <Typography fontWeight={600}>{item.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.detail}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={item.status} 
                      color="success" 
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  );
}