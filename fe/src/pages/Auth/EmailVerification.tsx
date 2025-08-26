import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  VpnKey as KeyIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';

function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'input' | 'verifying' | 'success' | 'error'>('input');
  const [verificationKey, setVerificationKey] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  // Get email from navigation state or URL params
  const email = location.state?.email || new URLSearchParams(location.search).get('email');

  useEffect(() => {
    if (!email) {
      // Redirect to register if no email provided
      navigate('/register');
    }
  }, [email, navigate]);

  const handleKeyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setVerificationKey(value);
    }
  };

  const handleVerifyKey = async () => {
    if (verificationKey.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      setStatus('verifying');
      
      const response = await apiService.verifyKey({
        email: email!,
        verificationKey,
      });
      
      if (response.success) {
        setStatus('success');
        setMessage('Your email has been successfully verified! You can now log in.');
        toast.success('Email verified successfully!');
      } else {
        setStatus('error');
        setMessage(response.message || 'Verification failed.');
        toast.error(response.message || 'Verification failed.');
      }
    } catch (error: any) {
      setStatus('error');
      const errorMessage = error.message || 'Verification failed. Please check your code and try again.';
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Email address is required to resend verification.');
      return;
    }

    try {
      setResendLoading(true);
      const response = await apiService.resendVerificationEmail(email);
      
      if (response.success) {
        toast.success('New verification code sent! Please check your inbox.');
        setVerificationKey(''); // Clear the input
        setStatus('input'); // Reset to input state
      } else {
        toast.error(response.message || 'Failed to send verification code.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification code.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationKey.length === 6) {
      handleVerifyKey();
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'input':
        return (
          <Box textAlign="center" sx={{ py: 4 }}>
            <KeyIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              Enter Verification Code
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              We've sent a 6-digit verification code to <strong>{email}</strong>
            </Typography>
            
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <TextField
                value={verificationKey}
                onChange={handleKeyInput}
                onKeyPress={handleKeyPress}
                placeholder="000000"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '24px',
                    fontWeight: 'bold',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                  },
                  '& .MuiOutlinedInput-input': {
                    textAlign: 'center',
                    padding: '20px',
                  },
                  width: '200px',
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  maxLength: 6,
                  style: { textAlign: 'center' },
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the 6-digit code from your email
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleVerifyKey}
                disabled={verificationKey.length !== 6 || loading}
                sx={{ px: 4 }}
              >
                {loading ? <CircularProgress size={20} /> : 'Verify Email'}
              </Button>
            </Box>

            <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  <strong>Didn't receive the code?</strong><br />
                  • Check your spam/junk folder<br />
                  • Make sure you entered the correct email address<br />
                  • The code expires in 30 minutes
                </Typography>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
              <Button
                variant="text"
                startIcon={<RefreshIcon />}
                onClick={handleResendVerification}
                disabled={resendLoading}
              >
                {resendLoading ? <CircularProgress size={20} /> : 'Resend Code'}
              </Button>
            </Box>
          </Box>
        );

      case 'verifying':
        return (
          <Box textAlign="center" sx={{ py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 3, color: 'primary.main' }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Verifying your code...
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please wait while we verify your verification code.
            </Typography>
          </Box>
        );

      case 'success':
        return (
          <Box textAlign="center" sx={{ py: 4 }}>
            <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
              Email Verified!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {message}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ px: 4 }}
            >
              Continue to Login
            </Button>
          </Box>
        );

      case 'error':
        return (
          <Box textAlign="center" sx={{ py: 4 }}>
            <EmailIcon sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'error.main' }}>
              Verification Failed
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {message}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setStatus('input');
                  setVerificationKey('');
                }}
              >
                Try Again
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handleResendVerification}
                disabled={resendLoading}
              >
                {resendLoading ? <CircularProgress size={20} /> : 'Resend Code'}
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f6fa',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={2}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              py: 3,
              px: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Email Verification
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
              Mini Trello
            </Typography>
          </Box>

          {/* Content */}
          <Box sx={{ p: 4 }}>
            {renderContent()}
          </Box>
        </Paper>

        {/* Footer */}
        <Box textAlign="center" sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Need help? Contact our{' '}
            <Button
              variant="text"
              size="small"
              sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
            >
              support team
            </Button>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default EmailVerification;
