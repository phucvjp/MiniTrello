import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import { GitHub } from "@mui/icons-material";
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGitHub, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showVerificationOption, setShowVerificationOption] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowVerificationOption(false);

    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);

      // If it's an email verification error, show verification option
      if (errorMessage.includes("verify your email")) {
        handleGoToVerification();
      }
    }
  };

  const handleGoToVerification = () => {
    navigate("/verify-email", {
      state: { email: formData.email },
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 600, color: "primary.main" }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to your Mini Trello account
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                action={
                  showVerificationOption && (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={handleGoToVerification}
                    >
                      Verify Email
                    </Button>
                  )
                }
              >
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              {loading ? <CircularProgress size={24} /> : "Sign In"}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={loginWithGitHub}
              disabled={loading}
              startIcon={<GitHub />}
              sx={{
                mb: 2,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderColor: "#333",
                color: "#333",
                "&:hover": {
                  borderColor: "#000",
                  backgroundColor: "rgba(0,0,0,0.04)",
                },
              }}
            >
              Continue with GitHub
            </Button>

            <Box textAlign="center">
              <Typography variant="body2">
                Don't have an account?{" "}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{ fontWeight: 600 }}
                >
                  Sign up here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
