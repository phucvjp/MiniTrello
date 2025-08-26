import React from "react";
import { Box, Container, Typography, Paper, Avatar, Chip } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

function Profile() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={4}>
          <Avatar
            src={user.avatar}
            sx={{
              width: 80,
              height: 80,
              mr: 3,
              bgcolor: "primary.main",
              fontSize: "2rem",
            }}
          >
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {user.username}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {user.email}
            </Typography>
            <Box display="flex" gap={1}>
              <Chip
                label={user.isEmailVerified ? "Verified" : "Unverified"}
                color={user.isEmailVerified ? "success" : "warning"}
                size="small"
              />
            </Box>
          </Box>
        </Box>

        {user.bio && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Bio
            </Typography>
            <Typography variant="body1">{user.bio}</Typography>
          </Box>
        )}

        <Box>
          <Typography variant="h6" gutterBottom>
            Account Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </Typography>
          {user.lastLoginAt && (
            <Typography variant="body2" color="text.secondary">
              Last login {new Date(user.lastLoginAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default Profile;
