import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  IconButton,
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Board } from "../../types";
import { apiService } from "../../services/api";
import CreateBoardDialog from "../../components/Board/CreateBoardDialog";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const drawerWidth = 280;

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBoards();
      if (response.success) {
        setBoards(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load boards:", error);
      setError("Failed to load boards");
    } finally {
      setLoading(false);
    }
  };

  const handleBoardCreated = (newBoard: Board) => {
    setBoards([newBoard, ...boards]);
  };

  const handleBoardClick = (boardId: string) => {
    navigate(`/board/${boardId}`);
  };

  return (
    <Box sx={{ display: "flex", bgcolor: "#f5f6fa", minHeight: "100vh" }}>
      {/* Left Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#ffffff",
            borderRight: "1px solid #e0e6ed",
            mt: 8, // Account for top navbar
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <List>
            <ListItemButton selected>
              <ListItemIcon>
                <DashboardIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Boards"
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Your Boards Section */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1, px: 2 }}
            >
              YOUR BOARDS
            </Typography>
            <List dense>
              {boards.slice(0, 5).map((board) => (
                <ListItemButton
                  key={board.id}
                  onClick={() => handleBoardClick(board.id)}
                  sx={{ borderRadius: 1, mx: 1 }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: 1,
                      bgcolor: "primary.main",
                      mr: 1.5,
                    }}
                  />
                  <ListItemText
                    primary={board.title}
                    primaryTypographyProps={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: 0 }}>
        <Container maxWidth="xl">
          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, color: "#172b4d", mb: 1 }}
            >
              YOUR WORKSPACES
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your boards and collaborate with your team
            </Typography>
          </Box>

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            /* Boards Grid */
            <Box
              sx={{
                display: "flex",
                gap: 2,
                overflowX: "auto",
                pb: 2,
                "&::-webkit-scrollbar": {
                  height: 8,
                },
                "&::-webkit-scrollbar-track": {
                  background: "#f1f1f1",
                  borderRadius: 4,
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "#c1c1c1",
                  borderRadius: 4,
                },
              }}
            >
              {/* Existing Boards */}
              {boards.map((board) => (
                <Card
                  key={board.id}
                  onClick={() => handleBoardClick(board.id)}
                  sx={{
                    minWidth: 300,
                    maxWidth: 300,
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    },
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {board.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                      {board.description || "No description"}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={`${board.cardsCount || 0} cards`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                          fontSize: "0.75rem",
                        }}
                      />
                      {board.isPrivate && (
                        <Chip
                          label="Private"
                          size="small"
                          sx={{
                            bgcolor: "rgba(255,255,255,0.2)",
                            color: "white",
                            fontSize: "0.75rem",
                          }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {/* Create New Board Card */}
              <Card
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  minWidth: 300,
                  maxWidth: 300,
                  cursor: "pointer",
                  border: "2px dashed #ddd",
                  bgcolor: "#f8f9fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "primary.50",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center", p: 3 }}>
                  <IconButton
                    sx={{
                      bgcolor: "primary.main",
                      color: "white",
                      mb: 2,
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "text.primary" }}
                  >
                    Create new board
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start a new project with your team
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Create Board Dialog */}
          <CreateBoardDialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            onBoardCreated={handleBoardCreated}
          />
        </Container>
      </Box>
    </Box>
  );
}

export default Dashboard;
