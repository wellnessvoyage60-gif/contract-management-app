import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/layout/Layout';
import {
  Card, CardContent, Typography, Box, Button,
  CircularProgress, Grid, Chip, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import { Description, Edit, Send } from '@mui/icons-material';

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Feedback dialog state
  const [feedbackContractId, setFeedbackContractId] = useState(null);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchContracts = () => {
    api.get('/vendors/my-contracts')
      .then((res) => setContracts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContracts(); }, []);

  const handleSubmitFeedback = async () => {
    if (!feedbackContractId) return;
    setSubmitting(true);

    try {
      const formData = new URLSearchParams();
      if (feedbackComments) formData.append('comments', feedbackComments);

      await api.post(`/vendors/submit-feedback/${feedbackContractId}`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      setMessage('Feedback submitted successfully! Contract returned to initiator.');
      setFeedbackContractId(null);
      setFeedbackComments('');
      fetchContracts();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title='Vendor Portal'>
      <Typography variant='h5' fontWeight='bold' color='#1B4F72' gutterBottom>
        Contracts Assigned to You
      </Typography>

      {message && <Alert severity='info' sx={{ mb: 2 }}
        onClose={() => setMessage('')}>{message}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : contracts.length === 0 ? (
        <Card elevation={2} sx={{ borderRadius: 2, p: 5, textAlign: 'center' }}>
          <Typography color='text.secondary'>
            No contracts assigned to you at this time.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {contracts.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <Card elevation={2} sx={{ borderRadius: 2, borderTop: '4px solid #F39C12' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant='subtitle2' color='text.secondary'>
                      {c.contract_number}
                    </Typography>
                    <Chip label='Needs Feedback' size='small' color='warning' />
                  </Box>
                  <Typography variant='h6' fontWeight='bold' gutterBottom>
                    {c.title}
                  </Typography>

                  {/* Open in editor for editing with track changes */}
                  <Button
                    variant='contained' fullWidth startIcon={<Edit />}
                    onClick={() => navigate(`/contracts/${c.id}/edit`)}
                    sx={{ mb: 1, bgcolor: '#1B4F72', '&:hover': { bgcolor: '#154360' } }}
                  >
                    Edit with Track Changes
                  </Button>

                  {/* Submit feedback back to initiator */}
                  <Button
                    variant='outlined' fullWidth startIcon={<Send />}
                    color='warning'
                    onClick={() => setFeedbackContractId(c.id)}
                  >
                    Submit Feedback
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Feedback Submission Dialog */}
      <Dialog open={!!feedbackContractId}
        onClose={() => setFeedbackContractId(null)}
        maxWidth='sm' fullWidth>
        <DialogTitle>Submit Vendor Feedback</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            This will return the contract to the initiator with your changes and comments.
          </Typography>
          <TextField
            fullWidth multiline rows={4}
            label='Comments (optional)'
            value={feedbackComments}
            onChange={(e) => setFeedbackComments(e.target.value)}
            placeholder='Describe the changes you made or any concerns...'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackContractId(null)}>Cancel</Button>
          <Button variant='contained' onClick={handleSubmitFeedback}
            disabled={submitting}
            sx={{ bgcolor: '#F39C12', '&:hover': { bgcolor: '#E67E22' } }}>
            {submitting ? 'Submitting...' : 'Submit & Return'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}