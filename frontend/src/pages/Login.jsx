import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  Container, Avatar, InputAdornment, IconButton
} from '@mui/material';
import {
  LockOutlined,
  Visibility,
  VisibilityOff,
  Email,
  Description
} from '@mui/icons-material';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      if (data.role === 'vendor') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '80%',
        height: '80%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '-50%',
        left: '-10%',
        width: '80%',
        height: '80%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
      },
    }}>
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Card 
          elevation={8} 
          sx={{ 
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}
        >
          {/* Header Section */}
          <Box sx={{
            bgcolor: 'white',
            p: 4,
            pb: 3,
            borderBottom: '1px solid #f0f0f0',
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
            }}>
              {/* Logo */}
              <Box sx={{
                width: 90,
                height: 90,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #1a2980, #26d0ce)',
                boxShadow: '0 4px 15px rgba(26, 41, 128, 0.3)',
              }}>
                <Description sx={{ fontSize: 48, color: 'white' }} />
              </Box>

              {/* Title */}
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                sx={{ 
                  background: 'linear-gradient(135deg, #1a2980, #26d0ce)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                Welcome Back
              </Typography>
              
              <Typography 
                variant="h6" 
                fontWeight="600" 
                color="#2c3e50"
                sx={{ mb: 0.5 }}
              >
                ContractPro
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary"
              >
                Banglalink CLM Platform
              </Typography>
            </Box>
          </Box>

          {/* Form Section */}
          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: '8px',
                  borderLeft: '4px solid #dc3545',
                }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                margin="normal"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                margin="normal"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1,
                mb: 3,
              }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: '0.875rem' }}
                >
                  <Box component="span" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    Forgot Password?
                  </Box>
                </Typography>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #1a2980, #26d0ce)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 15px rgba(26, 41, 128, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0d1a52, #1fb5b3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(26, 41, 128, 0.4)',
                  },
                  '&:disabled': {
                    background: '#ccc',
                  },
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <Typography 
                variant="body2" 
                color="text.secondary" 
                align="center"
                sx={{ mt: 3 }}
              >
                Don't have an account?{' '}
                <Box 
                  component="span" 
                  sx={{ 
                    color: '#1a2980',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Register here
                </Box>
              </Typography>
            </form>
          </CardContent>

          {/* Footer */}
          <Box sx={{ 
            p: 2,
            bgcolor: '#f8f9fa',
            borderTop: '1px solid #e9ecef',
            textAlign: 'center',
          }}>
            <Typography variant="caption" color="text.secondary">
              © 2026 ContractPro - Banglalink Digital Communications Ltd.
            </Typography>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}